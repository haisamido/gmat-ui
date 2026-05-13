#!/bin/bash
# GMAT Docker Container Entrypoint
# Supports both native and web builds

set -e

case "${1:-help}" in
  native)
    echo "=== Building and running native GmatConsole ==="
    task native:configure:console
    task native:build:console
    task native:copy:config || true
    cd /gmat/deployments/application/bin
    exec ./GmatConsole
    ;;
  native:build)
    echo "=== Building native GmatConsole ==="
    task native:configure:console
    task native:build:console
    task native:copy:config || true
    echo "Build complete. Binary at /gmat/deployments/application/bin/GmatConsole"
    ;;
  native:run)
    cd /gmat/deployments/application/bin
    exec ./GmatConsole
    ;;
  web)
    echo "=== Building and serving web on port 8989 ==="
    task web:build
    task web:run
    ;;
  web:build)
    echo "=== Building web ==="
    task web:build
    echo "Build complete. Output at /gmat/deployments/web/out/"
    ;;
  web:run)
    echo "=== Serving web on port 8989 ==="
    task web:run
    ;;
  shell|bash)
    exec /bin/bash
    ;;
  task)
    shift
    exec task "$@"
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
    echo "  web             Build and serve web UI on port 8989"
    echo "  web:build       Build web only"
    echo "  web:run         Serve pre-built web UI on port 8989"
    echo "  shell           Open bash shell"
    echo "  task <name>     Run any Taskfile task"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  docker run -it gmat-builder native"
    echo "  docker run -p 8989:8989 gmat-builder web"
    echo "  docker run -it gmat-builder shell"
    echo "  docker run gmat-builder task native:info"
    echo "  docker run gmat-builder task web:info"
    echo ""
    echo "Build specific targets (run from repository root):"
    echo "  docker build -f deployments/Containerfile --target native -t gmat-native ."
    echo "  docker build -f deployments/Containerfile --target wasm-builder -t gmat-web ."
    echo "  docker build -f deployments/Containerfile --target wasm -t gmat-web-runtime ."
    ;;
esac
