#!/usr/bin/env bash
# Build CSPICE for WebAssembly using Emscripten
#
# Prerequisites:
#   - Emscripten SDK activated (emcc available in PATH)
#
# Usage:
#   ./build-cspice.sh [output_dir]
#
# Output:
#   <output_dir>/cspice/lib/cspice.a     - Static library
#   <output_dir>/cspice/include/          - Header files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPS_DIR="${1:-${SCRIPT_DIR}/deps}"
# Resolve to absolute path so that 'cd' later doesn't break relative references
mkdir -p "${DEPS_DIR}"
DEPS_DIR="$(cd "${DEPS_DIR}" && pwd)"
CSPICE_VERSION="N0067"
CSPICE_PLATFORM="PC_Linux_GCC_64bit"
CSPICE_URL="https://naif.jpl.nasa.gov/pub/naif/misc/toolkit_${CSPICE_VERSION}/C/${CSPICE_PLATFORM}/packages/cspice.tar.Z"

WORK_DIR="${DEPS_DIR}/cspice-src"
OUT_DIR="${DEPS_DIR}/cspice"

# Check for emcc
if ! command -v emcc &> /dev/null; then
    echo "ERROR: emcc not found. Please activate the Emscripten SDK first:"
    echo "  source <emsdk>/emsdk_env.sh"
    exit 1
fi

# Skip if already built
if [ -f "${OUT_DIR}/lib/cspice.a" ]; then
    echo "CSPICE for WASM already built at ${OUT_DIR}/lib/cspice.a"
    exit 0
fi

echo "=== Building CSPICE for WebAssembly ==="

# Download and extract
mkdir -p "${WORK_DIR}"
cd "${WORK_DIR}"

if [ ! -d "cspice" ]; then
    echo "Downloading CSPICE ${CSPICE_VERSION}..."
    echo "  URL: ${CSPICE_URL}"
    if ! curl -fSL -o cspice.tar.Z "${CSPICE_URL}"; then
        echo "ERROR: Failed to download CSPICE from ${CSPICE_URL}"
        echo "  Check your network connection or if NAIF URL has changed."
        exit 1
    fi
    # .Z files are Unix compress format - gzip can decompress them
    gzip -d cspice.tar.Z
    tar -xf cspice.tar
    rm -f cspice.tar
fi

# Patch f2c function signature mismatches for WASM.
# In WASM with C++ exception handling (-fexceptions), function calls go through
# invoke_* wrappers that use call_indirect, which validates function signatures
# at runtime. f2c-generated code declares subroutine wrappers as returning int,
# but the f2c runtime defines s_copy/s_cat as returning void. This mismatch
# causes a "RuntimeError: unreachable" trap in WASM.
echo "Patching CSPICE source for WASM function signature compatibility..."
cd cspice/src/cspice

python3 <<'PYEOF'
import re

def patch_file(filename, replacements, add_return_0=False):
    """Apply text replacements and optionally add 'return 0;' before the last '}'."""
    with open(filename, 'r') as f:
        src = f.read()
    for old, new in replacements:
        src = src.replace(old, new)
    if add_return_0:
        # Add 'return 0;\n' before the very last closing brace
        pos = src.rfind('}')
        if pos >= 0 and 'return 0;' not in src[max(0,pos-40):pos]:
            src = src[:pos] + 'return 0;\n' + src[pos:]
    with open(filename, 'w') as f:
        f.write(src)
    print(f"  Patched {filename}")

# 1. s_copy: defined as void, callers expect int
patch_file('s_copy.c', [
    ('VOID s_copy(a, b, la, lb)', 'int s_copy(a, b, la, lb)'),
    ('void s_copy(register char *a, register char *b, ftnlen la, ftnlen lb)',
     'int s_copy(register char *a, register char *b, ftnlen la, ftnlen lb)'),
], add_return_0=True)

# 2. s_cat: defined as VOID (=void), callers expect int
#    Format is " VOID\n#ifdef KR_headers\ns_cat(" on separate lines
patch_file('s_cat.c', [
    (' VOID\n#ifdef KR_headers\ns_cat(', ' int\n#ifdef KR_headers\ns_cat('),
], add_return_0=True)

# 3. zzsetnnread_: defined as void in rsfe.c, declared as int in rdker.c
#    Both the forward declaration and the function definition need fixing.
patch_file('rsfe.c', [
    ('void    zzsetnnread_( logical * on );', 'int     zzsetnnread_( logical * on );'),
    ('void zzsetnnread_( logical * on )',     'int zzsetnnread_( logical * on )'),
], add_return_0=False)

# For zzsetnnread_, add return 0 inside the specific function body
with open('rsfe.c', 'r') as f:
    src = f.read()
src = src.replace(
    'int zzsetnnread_( logical * on )\n   {\n   read_non_native = *on;\n   }',
    'int zzsetnnread_( logical * on )\n   {\n   read_non_native = *on;\n   return 0;\n   }'
)
with open('rsfe.c', 'w') as f:
    f.write(src)
print("  Patched rsfe.c (zzsetnnread_ body)")
PYEOF

# Compile all CSPICE C source files with emcc
echo "Compiling CSPICE with emcc (${PARALLEL_JOBS:-$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)} parallel jobs)..."

# CSPICE is K&R-style C — use gnu89 to allow implicit int, implicit function
# declarations, and other pre-C99 patterns that modern clang rejects by default.
export CFLAGS="-std=gnu89 -O2 -DNON_UNIX_STDIO -DUIOLEN_int -Wno-implicit-function-declaration -Wno-implicit-int -Wno-parentheses -Wno-shift-op-parentheses -Wno-logical-op-parentheses -Wno-dangling-else -Wno-return-type"
export INCLUDE_DIR="../../include"

# Compile in parallel using xargs
JOBS="${PARALLEL_JOBS:-$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)}"
SOURCE_COUNT=$(ls *.c | wc -l)
echo "  Compiling ${SOURCE_COUNT} source files..."

ls *.c | xargs -P "${JOBS}" -I{} sh -c 'emcc ${CFLAGS} -c "{}" -o "${1%.c}.o" -I${INCLUDE_DIR}' _ {}

# Verify all compilations succeeded (each .c should have a .o)
OBJECT_COUNT=$(ls *.o 2>/dev/null | wc -l)
if [ "${OBJECT_COUNT}" -lt "${SOURCE_COUNT}" ]; then
    echo "ERROR: Only ${OBJECT_COUNT} of ${SOURCE_COUNT} files compiled successfully."
    echo "Check for compilation errors above."
    exit 1
fi

# Collect all object files
OBJECTS=$(ls *.o | tr '\n' ' ')

# Create static archive
echo "Creating static archive..."
mkdir -p "${OUT_DIR}/lib"
emar rcs "${OUT_DIR}/lib/cspice.a" ${OBJECTS}

# Also create a debug copy (same as release for WASM)
cp "${OUT_DIR}/lib/cspice.a" "${OUT_DIR}/lib/cspiced.a"

# Copy headers
echo "Copying headers..."
mkdir -p "${OUT_DIR}/include"
cp ../../include/*.h "${OUT_DIR}/include/"

echo "=== CSPICE for WASM built successfully ==="
echo "  Library: ${OUT_DIR}/lib/cspice.a"
echo "  Headers: ${OUT_DIR}/include/"
