#!/usr/bin/env bash
# Build GMAT Console for WebAssembly using Emscripten
#
# Prerequisites:
#   - Emscripten SDK installed and activated (emcc/emcmake in PATH)
#   - CMake 3.19+
#   - GMAT dependencies built for WASM (run with --deps first, or use 'task web:deps')
#
# Usage:
#   ./build.sh              # Build GmatConsole.js + GmatConsole.wasm
#   ./build.sh --deps       # Build dependencies (CSPICE, Xerces-C) for WASM
#   ./build.sh --configure  # Configure CMake only
#   ./build.sh --clean      # Clean build artifacts
#   ./build.sh --run        # Serve in browser via HTTP
#   ./build.sh --all        # Build deps + configure + build
#   ./build.sh --info       # Show build configuration

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

WASM_BUILD_DIR="${SCRIPT_DIR}/build"
WASM_DEPS_DIR="${SCRIPT_DIR}/deps"
WASM_OUT_DIR="${SCRIPT_DIR}/out"
PARALLEL_JOBS="${PARALLEL_JOBS:-$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)}"
USE_MODULAR_UI="${USE_MODULAR_UI:-false}"

# ============================================================================
# Helper functions
# ============================================================================

check_emscripten() {
    if ! command -v emcc &> /dev/null; then
        echo "ERROR: Emscripten SDK not found."
        echo ""
        echo "Install and activate Emscripten:"
        echo "  git clone https://github.com/emscripten-core/emsdk.git"
        echo "  cd emsdk"
        echo "  ./emsdk install latest"
        echo "  ./emsdk activate latest"
        echo "  source ./emsdk_env.sh"
        exit 1
    fi
    echo "Emscripten: $(emcc --version | head -1)"
}

build_deps() {
    check_emscripten
    echo "=== Building WASM dependencies ==="
    bash "${SCRIPT_DIR}/build-cspice.sh" "${WASM_DEPS_DIR}"
    bash "${SCRIPT_DIR}/build-xerces.sh" "${WASM_DEPS_DIR}"
    echo "=== Dependencies built ==="
}

configure() {
    check_emscripten

    if [ ! -f "${WASM_DEPS_DIR}/cspice/lib/cspice.a" ]; then
        echo "ERROR: CSPICE not built for WASM. Run with --deps first."
        exit 1
    fi
    if [ ! -d "${WASM_DEPS_DIR}/xerces" ]; then
        echo "ERROR: Xerces-C not built for WASM. Run with --deps first."
        exit 1
    fi

    echo "=== Configuring GMAT for WebAssembly ==="
    mkdir -p "${WASM_BUILD_DIR}"

    emcmake cmake \
        -S "${ROOT_DIR}" \
        -B "${WASM_BUILD_DIR}" \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_PROJECT_GMAT_INCLUDE="${SCRIPT_DIR}/wasm-overrides.cmake" \
        -DGMAT_INCLUDE_GUI=OFF \
        -DGMAT_INCLUDE_CSALT=OFF \
        -DGMAT_INCLUDE_API=OFF \
        -DPLUGIN_CINTERFACE=OFF \
        -DPLUGIN_DATAINTERFACE=OFF \
        -DPLUGIN_DATACALLBACK=OFF \
        -DPLUGIN_EPHEMPROPAGATOR=OFF \
        -DPLUGIN_EKF=OFF \
        -DPLUGIN_ESTIMATION=OFF \
        -DPLUGIN_EVENTLOCATOR=OFF \
        -DPLUGIN_EXTERNALFORCEMODEL=OFF \
        -DPLUGIN_EXTRAPROPAGATORS=OFF \
        -DPLUGIN_FMINCONOPTIMIZER=OFF \
        -DPLUGIN_FORMATION=OFF \
        -DPLUGIN_GEOMETRICMEASUREMENT=OFF \
        -DPLUGIN_GMATFUNCTION=OFF \
        -DPLUGIN_MATLABINTERFACE=OFF \
        -DPLUGIN_NEWPARAMETERS=OFF \
        -DPLUGIN_POLYHEDRONGRAVITY=OFF \
        -DPLUGIN_PRODUCTIONPROPAGATORS=OFF \
        -DPLUGIN_PYTHONINTERFACE=OFF \
        -DPLUGIN_SAVECOMMAND=OFF \
        -DPLUGIN_SCRIPTTOOLS=OFF \
        -DPLUGIN_STATION=OFF \
        -DPLUGIN_THRUSTFILE=OFF \
        -DPLUGIN_TLEPROPAGATOR=OFF \
        -DPLUGIN_YUKONOPTIMIZER=OFF \
        -DCSPICE_DIR="${WASM_DEPS_DIR}/cspice" \
        -DXercesC_DIR="${WASM_DEPS_DIR}/xerces" \
        -DCMAKE_PREFIX_PATH="${WASM_DEPS_DIR}/xerces" \
        -DCMAKE_FIND_ROOT_PATH="${WASM_DEPS_DIR}/xerces;${WASM_DEPS_DIR}/cspice" \
        -DCMAKE_CXX_FLAGS="-fexceptions" \
        -DCMAKE_C_FLAGS="-fexceptions" \
        -DCMAKE_EXE_LINKER_FLAGS="-sALLOW_MEMORY_GROWTH=1 -sENVIRONMENT=web,node -sEXIT_RUNTIME=1 -sFORCE_FILESYSTEM=1 -sINVOKE_RUN=0 -sEXPORTED_RUNTIME_METHODS=callMain,FS -sDISABLE_EXCEPTION_CATCHING=0 -sSTACK_SIZE=2097152 -sMODULARIZE=1 -sEXPORT_NAME=createGmatModule --preload-file ${ROOT_DIR}/application/data@/application/data --preload-file ${SCRIPT_DIR}/gmat_startup_file_wasm.txt@/application/bin/gmat_startup_file.txt" \
        -DCMAKE_EXECUTABLE_SUFFIX=".js" \
        -DGMAT_BUILDOUTPUT_DIRECTORY="${ROOT_DIR}/deployments/application"

    # GMAT's CMakeLists.txt adds Linux-specific linker flags under
    # if(UNIX AND NOT APPLE) that wasm-ld doesn't support:
    #   -Wl,--enable-new-dtags  (ELF RPATH feature)
    #   -Wl,--no-undefined      (ELF link validation)
    # Strip these from the generated build files after configuration.
    echo "Stripping unsupported linker flags for wasm-ld..."
    while IFS= read -r -d '' linkfile; do
        sed -i.bak 's/-Wl,--enable-new-dtags//g; s/-Wl,--no-undefined//g' "${linkfile}"
        rm -f "${linkfile}.bak"
    done < <(find "${WASM_BUILD_DIR}" -name "link.txt" -print0)

    echo "=== Configuration complete ==="
}

build() {
    if [ ! -f "${WASM_BUILD_DIR}/CMakeCache.txt" ]; then
        echo "ERROR: Not configured. Run with --configure first."
        exit 1
    fi

    echo "=== Building GMAT Console for WebAssembly ==="
    cmake --build "${WASM_BUILD_DIR}" --target GmatConsole --parallel "${PARALLEL_JOBS}"

    # Copy output to out/
    # GMAT's CMake outputs to deployments/application/bin/ and appends the version to the
    # executable name (e.g. GmatConsole.js-R2026a) with a symlink GmatConsole.js.
    local APP_BIN="${ROOT_DIR}/deployments/application/bin"
    mkdir -p "${WASM_OUT_DIR}"
    cp -L "${APP_BIN}/GmatConsole.js" "${WASM_OUT_DIR}/" 2>/dev/null || \
        cp "${APP_BIN}"/GmatConsole.js* "${WASM_OUT_DIR}/"
    cp "${APP_BIN}/GmatConsole.wasm" "${WASM_OUT_DIR}/" 2>/dev/null || true
    cp "${APP_BIN}/GmatConsole.data" "${WASM_OUT_DIR}/" 2>/dev/null || true
    cp "${APP_BIN}/GmatConsole.worker.js" "${WASM_OUT_DIR}/" 2>/dev/null || true

    # Copy Rich Web GUI (includes sw.js for session ID injection)
    # Default: use monolithic version from monolithic/
    # With --modular flag: use modular version from ui/ + src/gui/ modules
    mkdir -p "${WASM_OUT_DIR}/ui"
    if [ "${USE_MODULAR_UI}" = "true" ] && [ -d "${SCRIPT_DIR}/ui" ]; then
        echo "Using MODULAR UI (ui/ + src/gui/)"
        # Copy the main entry point files
        cp -r "${SCRIPT_DIR}/ui/"* "${WASM_OUT_DIR}/ui/"
        # Copy the modular GUI source files to core/
        if [ -d "${SCRIPT_DIR}/src/gui" ]; then
            mkdir -p "${WASM_OUT_DIR}/ui/core"
            cp -r "${SCRIPT_DIR}/src/gui/"* "${WASM_OUT_DIR}/ui/core/"
        fi
    elif [ -f "${SCRIPT_DIR}/monolithic/index.html" ]; then
        echo "Using MONOLITHIC UI (monolithic/)"
        cp "${SCRIPT_DIR}/monolithic/index.html" "${WASM_OUT_DIR}/ui/"
    elif [ -f "${SCRIPT_DIR}/ui/index.html" ]; then
        echo "Using UI from ui/ (fallback)"
        cp "${SCRIPT_DIR}/ui/index.html" "${WASM_OUT_DIR}/ui/"
    fi
    # Copy favicon
    cp "${ROOT_DIR}/application/data/graphics/icons/GMAT.ico" "${WASM_OUT_DIR}/ui/" 2>/dev/null || true

    # Copy 3D model files for browser-side rendering
    local MODELS_SRC="${ROOT_DIR}/application/data/vehicle/models"
    if [ -d "${MODELS_SRC}" ]; then
        mkdir -p "${WASM_OUT_DIR}/ui/models"
        cp "${MODELS_SRC}/"*.3ds "${WASM_OUT_DIR}/ui/models/" 2>/dev/null || true
        cp "${MODELS_SRC}/"*.jpg "${WASM_OUT_DIR}/ui/models/" 2>/dev/null || true
    fi

    # Copy sample scripts for "Load Sample" (read list from samples_to_include.txt)
    local SAMPLES_SRC="${ROOT_DIR}/application/samples"
    local SAMPLES_LIST="${SCRIPT_DIR}/samples_to_include.txt"
    if [ -d "${SAMPLES_SRC}" ] && [ -f "${SAMPLES_LIST}" ]; then
        mkdir -p "${WASM_OUT_DIR}/ui/samples"
        # Read script names, skip comments and empty lines
        grep -v '^#' "${SAMPLES_LIST}" | grep -v '^$' | while read -r script; do
            cp "${SAMPLES_SRC}/${script}.script" "${WASM_OUT_DIR}/ui/samples/" 2>/dev/null || true
        done
        # Generate samples.json for the UI to read
        echo "[" > "${WASM_OUT_DIR}/ui/samples/samples.json"
        grep -v '^#' "${SAMPLES_LIST}" | grep -v '^$' | while read -r script; do
            echo "  \"${script}.script\"," >> "${WASM_OUT_DIR}/ui/samples/samples.json"
        done
        # Remove trailing comma and close array
        sed -i.bak '$ s/,$//' "${WASM_OUT_DIR}/ui/samples/samples.json" && rm -f "${WASM_OUT_DIR}/ui/samples/samples.json.bak"
        echo "]" >> "${WASM_OUT_DIR}/ui/samples/samples.json"
    fi

    echo ""
    echo "=== Build complete ==="
    echo "Output files:"
    ls -lh "${WASM_OUT_DIR}/"
    echo ""
    echo "To run in browser: ./build.sh --run"
}

run() {
    if [ ! -f "${WASM_OUT_DIR}/GmatConsole.js" ]; then
        echo "ERROR: GmatConsole.js not found. Run build first."
        exit 1
    fi
    if [ ! -f "${WASM_OUT_DIR}/ui/index.html" ]; then
        echo "ERROR: ui/index.html not found in output directory."
        exit 1
    fi

    local PORT="${1:-8080}"
    local GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local GIT_HASH_FULL=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    # Get repo URL and convert to commit URL base (remove .git suffix if present)
    local REPO_URL=$(git config --get remote.origin.url 2>/dev/null | sed 's/\.git$//' || echo "")
    local REPO_COMMIT_URL="${REPO_URL}/commit/"
    echo "=== Serving GMAT Console (WASM) ==="
    echo "Open http://localhost:${PORT}/ui/ in your browser"
    echo "Press Ctrl+C to stop the server"
    echo ""
    # Use Node.js server (same as Docker runtime)
    PORT="${PORT}" \
    ROOT_DIR="${WASM_OUT_DIR}" \
    GIT_COMMIT="${GIT_HASH}" \
    GIT_COMMIT_FULL="${GIT_HASH_FULL}" \
    REPO_COMMIT_URL="${REPO_COMMIT_URL}" \
    node "${SCRIPT_DIR}/server.js"
}

clean() {
    echo "Cleaning WASM build artifacts..."
    rm -rf "${WASM_BUILD_DIR}"
    rm -rf "${WASM_OUT_DIR}"
    echo "Cleaned. (Dependencies in deps/ preserved. Use --clean-all to remove.)"
}

clean_all() {
    echo "Cleaning all WASM artifacts including dependencies..."
    rm -rf "${WASM_BUILD_DIR}"
    rm -rf "${WASM_OUT_DIR}"
    rm -rf "${WASM_DEPS_DIR}"
    echo "All WASM artifacts removed."
}

show_info() {
    echo "=== GMAT WASM Build Configuration ==="
    echo ""
    echo "Directories:"
    echo "  GMAT root:     ${ROOT_DIR}"
    echo "  WASM scripts:  ${SCRIPT_DIR}"
    echo "  Build dir:     ${WASM_BUILD_DIR}"
    echo "  Dependencies:  ${WASM_DEPS_DIR}"
    echo "  Output:        ${WASM_OUT_DIR}"
    echo "  Parallel jobs: ${PARALLEL_JOBS}"
    echo ""

    echo "Emscripten:"
    if command -v emcc &> /dev/null; then
        echo "  $(emcc --version | head -1)"
    else
        echo "  NOT FOUND"
    fi
    echo ""

    echo "Dependencies:"
    if [ -f "${WASM_DEPS_DIR}/cspice/lib/cspice.a" ]; then
        echo "  CSPICE:   built ($(du -sh "${WASM_DEPS_DIR}/cspice/lib/cspice.a" | cut -f1))"
    else
        echo "  CSPICE:   not built"
    fi
    if [ -f "${WASM_DEPS_DIR}/xerces/lib/libxerces-c.a" ]; then
        echo "  Xerces-C: built ($(du -sh "${WASM_DEPS_DIR}/xerces/lib/libxerces-c.a" | cut -f1))"
    else
        echo "  Xerces-C: not built"
    fi
    echo ""

    echo "Build status:"
    if [ -f "${WASM_BUILD_DIR}/CMakeCache.txt" ]; then
        echo "  Configured: yes"
    else
        echo "  Configured: no"
    fi
    if [ -f "${WASM_OUT_DIR}/GmatConsole.js" ]; then
        echo "  Built:      yes"
        ls -lh "${WASM_OUT_DIR}/GmatConsole.js" "${WASM_OUT_DIR}/GmatConsole.wasm" 2>/dev/null | awk '{print "    " $NF ": " $5}'
    else
        echo "  Built:      no"
    fi
}

# ============================================================================
# Main
# ============================================================================

case "${1:-}" in
    --deps)
        build_deps
        ;;
    --configure)
        configure
        ;;
    --build|"")
        build
        ;;
    --run)
        shift
        run "$@"
        ;;
    --clean)
        clean
        ;;
    --clean-all)
        clean_all
        ;;
    --all)
        build_deps
        configure
        build
        ;;
    --info)
        show_info
        ;;
    --help|-h)
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --deps       Build CSPICE and Xerces-C for WASM"
        echo "  --configure  Configure CMake with Emscripten"
        echo "  --build      Build GmatConsole (default)"
        echo "  --run [port] Serve in browser (default port 8080)"
        echo "  --all        Build deps + configure + build"
        echo "  --clean      Clean build and output (keep deps)"
        echo "  --clean-all  Clean everything including deps"
        echo "  --info       Show build configuration"
        echo "  --help       Show this help"
        ;;
    *)
        echo "Unknown option: $1"
        echo "Run '$0 --help' for usage."
        exit 1
        ;;
esac
