#!/bin/bash
# GMAT Docker Container Entrypoint
# Supports both native and web builds

set -e

DEPLOY_DIR=/gmat/deployments
APP_DIR=$DEPLOY_DIR/application
BUILD_DIR=$DEPLOY_DIR/cmake-build

configure_native() {
  local gui_flag="${1:-OFF}"
  mkdir -p "$BUILD_DIR"
  cmake -S /gmat -B "$BUILD_DIR" \
    -DCMAKE_BUILD_TYPE=Release \
    -DGMAT_INCLUDE_GUI="$gui_flag" \
    -DGMAT_BUILDOUTPUT_DIRECTORY="$APP_DIR"
}

build_native() {
  local target="${1:-GmatConsole}"
  cmake --build "$BUILD_DIR" --target "$target" --parallel "$(nproc)"
}

copy_config() {
  mkdir -p "$APP_DIR/bin" "$APP_DIR/output" "$APP_DIR/plugins"
  for f in gmat_startup_file.txt gmat_startup_file_mac_linux.txt \
           gmat_startup_file.public.txt gmat_startup_file_mac_linux.public.txt \
           GMAT.ini MacConfigure.txt; do
    [ -f /gmat/application/bin/$f ] && cp /gmat/application/bin/$f "$APP_DIR/bin/" || true
  done
  [ ! -e "$APP_DIR/data" ] && ln -s /gmat/application/data "$APP_DIR/data" || true
  [ ! -e "$APP_DIR/samples" ] && ln -s /gmat/application/samples "$APP_DIR/samples" || true
}

case "${1:-help}" in
  native)
    echo "=== Building and running native GmatConsole ==="
    configure_native OFF
    build_native GmatConsole
    copy_config || true
    cd "$APP_DIR/bin"
    exec ./GmatConsole
    ;;
  native:build)
    echo "=== Building native GmatConsole ==="
    configure_native OFF
    build_native GmatConsole
    copy_config || true
    echo "Build complete. Binary at $APP_DIR/bin/GmatConsole"
    ;;
  native:run)
    cd "$APP_DIR/bin"
    exec ./GmatConsole
    ;;
  web)
    echo "=== Building and serving web on port ${PORT:-8989} ==="
    cd "$DEPLOY_DIR"
    bash web/build.sh --deps
    bash web/build.sh --configure
    bash web/build.sh --build
    exec node web/server.js
    ;;
  web:build)
    echo "=== Building web ==="
    cd "$DEPLOY_DIR"
    bash web/build.sh --deps
    bash web/build.sh --configure
    bash web/build.sh --build
    echo "Build complete. Output at $DEPLOY_DIR/web/out/"
    ;;
  web:run)
    echo "=== Serving web on port ${PORT:-8989} ==="
    cd "$DEPLOY_DIR"
    exec node web/server.js
    ;;
  shell|bash)
    exec /bin/bash
    ;;
  help|--help|-h|*)
    echo "GMAT Docker Container"
    echo ""
    echo "Usage: docker run [OPTIONS] gmat-builder COMMAND"
    echo ""
    echo "Commands:"
    echo "  native          Build and run native GmatConsole"
    echo "  native:build    Build native GmatConsole only"
    echo "  native:run      Run pre-built native GmatConsole"
    echo "  web             Build and serve web UI on port ${PORT:-8989}"
    echo "  web:build       Build web only"
    echo "  web:run         Serve pre-built web UI on port ${PORT:-8989}"
    echo "  shell           Open bash shell"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  docker run -it gmat-builder native"
    echo "  docker run -p 8989:8989 gmat-builder web"
    echo "  docker run -it gmat-builder shell"
    echo ""
    echo "Build specific targets (run from deployments/):"
    echo "  docker build -f Containerfile --target native -t gmat-x11 ."
    echo "  docker build -f Containerfile --target vnc -t gmat-vnc ."
    echo "  docker build -f Containerfile --target wasm -t gmat-web ."
    ;;
esac
