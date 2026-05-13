#!/usr/bin/env bash
# Build Xerces-C for WebAssembly using Emscripten
#
# Prerequisites:
#   - Emscripten SDK activated (emcc/emcmake available in PATH)
#   - CMake 3.19+
#
# Usage:
#   ./build-xerces.sh [output_dir]
#
# Output:
#   <output_dir>/xerces/lib/libxerces-c.a  - Static library
#   <output_dir>/xerces/include/           - Header files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPS_DIR="${1:-${SCRIPT_DIR}/deps}"
# Resolve to absolute path so that 'cd' later doesn't break relative references
mkdir -p "${DEPS_DIR}"
DEPS_DIR="$(cd "${DEPS_DIR}" && pwd)"
XERCES_VERSION="3.2.5"
XERCES_ARCHIVE="https://archive.apache.org/dist/xerces/c/3/sources/xerces-c-${XERCES_VERSION}.tar.gz"
XERCES_CDN="https://dlcdn.apache.org/xerces/c/3/sources/xerces-c-${XERCES_VERSION}.tar.gz"

WORK_DIR="${DEPS_DIR}/xerces-src"
OUT_DIR="${DEPS_DIR}/xerces"
BUILD_DIR="${WORK_DIR}/build"

# Check for emcmake
if ! command -v emcmake &> /dev/null; then
    echo "ERROR: emcmake not found. Please activate the Emscripten SDK first:"
    echo "  source <emsdk>/emsdk_env.sh"
    exit 1
fi

# Skip if already built
if [ -f "${OUT_DIR}/lib/libxerces-c.a" ]; then
    echo "Xerces-C for WASM already built at ${OUT_DIR}/lib/libxerces-c.a"
    exit 0
fi

echo "=== Building Xerces-C ${XERCES_VERSION} for WebAssembly ==="

# Download and extract
mkdir -p "${WORK_DIR}"
cd "${WORK_DIR}"

if [ ! -d "xerces-c-${XERCES_VERSION}" ]; then
    echo "Downloading Xerces-C ${XERCES_VERSION}..."
    # Use --fail so curl returns non-zero on HTTP errors (e.g. 404)
    curl -fsSL "${XERCES_CDN}" -o xerces-c.tar.gz 2>/dev/null || \
    curl -fsSL "${XERCES_ARCHIVE}" -o xerces-c.tar.gz
    tar -xzf xerces-c.tar.gz
    rm -f xerces-c.tar.gz
fi

# Build with Emscripten
echo "Configuring Xerces-C with Emscripten..."
mkdir -p "${BUILD_DIR}"

emcmake cmake \
    -S "xerces-c-${XERCES_VERSION}" \
    -B "${BUILD_DIR}" \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX="${OUT_DIR}" \
    -DBUILD_SHARED_LIBS=OFF \
    -Dnetwork=OFF \
    -Dtranscoder=iconv \
    -Dmessage-loader=inmemory \
    -Dthreads=OFF \
    -DCMAKE_CXX_FLAGS="-O2"

echo "Building Xerces-C..."
cmake --build "${BUILD_DIR}" --parallel "$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)"

echo "Installing Xerces-C..."
cmake --install "${BUILD_DIR}"

echo "=== Xerces-C for WASM built successfully ==="
echo "  Library: ${OUT_DIR}/lib/libxerces-c.a"
echo "  Headers: ${OUT_DIR}/include/"
