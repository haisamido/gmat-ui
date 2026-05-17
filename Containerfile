# GMAT Multi-Target Build Container
# Builds NASA's General Mission Analysis Tool for Native Linux and WebAssembly
#
# Two build targets:
#   native - Console + GUI GMAT (ubuntu:26.04, both GmatConsole and GMAT binaries)
#   wasm   - Browser-based GMAT (node:20-slim, port 8989)
#
# Usage:
#   docker build -f Containerfile --target native -t gmat-native .
#   docker build -f Containerfile --target wasm -t gmat-web .
#
#   docker run -it gmat-native                # Console
#   docker run -it gmat-native ./GMAT         # GUI (requires X11)
#   docker run -p 8989:8989 gmat-web          # Web UI
#
# Task integration:
#   task build                   # Build all images
#   task up:web                  # Start the web UI
#   task up:x11                  # Start native GUI (X11)
#   task up:console              # Start native console

# =============================================================================
# Stage 1: Base image with common dependencies
# =============================================================================
FROM ubuntu:26.04 AS base

#--- PROXY CONFIG (if needed)
# ARG MAVEN_HTTPS_PROXY
# ARG HTTPS_PROXY
# ARG HTTP_PROXY
# ARG NO_PROXY
# ARG DEPLOYMENT_ENVIRO

# ENV MAVEN_HTTPS_PROXY=${MAVEN_HTTPS_PROXY}
# ENV HTTPS_PROXY=${HTTPS_PROXY}
# ENV HTTP_PROXY=${HTTP_PROXY}
# ENV NO_PROXY=${NO_PROXY}
# ENV DEPLOYMENT_ENVIRO=${DEPLOYMENT_ENVIRO}

LABEL maintainer="haisamido"
LABEL description="GMAT Multi-Target Build Container (Native + WebAssembly)"

ENV DEBIAN_FRONTEND=noninteractive
ENV PARALLEL_JOBS=6

# Install common build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    gzip \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install native build dependencies (shared by all stages)
RUN apt-get update && apt-get install -y \
    # wxWidgets (for GUI) - 3.2 includes wxBitmap::Rescale
    libwxgtk3.2-dev \
    # Xerces-C
    libxerces-c-dev \
    # OpenGL (for GUI)
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    freeglut3-dev \
    # Python (for PythonInterface plugin)
    python3-dev \
    # SWIG (for API bindings)
    swig \
    && rm -rf /var/lib/apt/lists/*

# Install Task (go-task) build automation tool
RUN curl -sL https://taskfile.dev/install.sh | sh -s -- -b /usr/local/bin

# Download and build CSPICE for Linux (supports both amd64 and arm64)
WORKDIR /opt/spice
RUN mkdir -p depends/cspice/linux && \
    cd depends/cspice/linux && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        echo "=== Downloading pre-built CSPICE for x86_64 ===" && \
        curl -sO https://naif.jpl.nasa.gov/pub/naif/misc/toolkit_N0067/C/PC_Linux_GCC_64bit/packages/cspice.tar.Z && \
        gzip -d cspice.tar.Z && \
        tar -xf cspice.tar && \
        mv cspice cspice64 && \
        rm -f cspice.tar; \
    elif [ "$ARCH" = "aarch64" ]; then \
        echo "=== Building CSPICE from source for arm64 ===" && \
        curl -sO https://naif.jpl.nasa.gov/pub/naif/misc/toolkit_N0067/C/PC_Linux_GCC_64bit/packages/cspice.tar.Z && \
        gzip -d cspice.tar.Z && \
        tar -xf cspice.tar && \
        cd cspice/src/cspice && \
        ls *.c | xargs -P$(nproc) -I{} gcc -c -ansi -O2 -fPIC {} && \
        ar -rs ../../lib/cspice.a *.o && \
        ranlib ../../lib/cspice.a && \
        cd ../csupport && \
        ls *.c | xargs -P$(nproc) -I{} gcc -c -ansi -O2 -fPIC {} && \
        ar -rs ../../lib/csupport.a *.o && \
        ranlib ../../lib/csupport.a && \
        cd ../../.. && \
        mv cspice cspice64 && \
        rm -f cspice.tar.Z; \
    else \
        echo "ERROR: Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    cd cspice64/lib && \
    cp cspice.a cspiced.a

    RUN apt-get update && \
      apt-get install -y --no-install-recommends \
        netcat-traditional netcat-openbsd \
          jq tmux tree vim curl wget && \
      apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# =============================================================================
# Stage 2: GMAT source image (cloned from NASA, with deployment overlay)
# =============================================================================
FROM base AS gmat-source

WORKDIR /gmat

ARG GIT_URL=https://github.com/nasa/GMAT
ARG GIT_COMMIT=ce6eba2ee4a2da22e01522741d926d0c574173ff

RUN git clone --recurse-submodules -j4 ${GIT_URL} .
RUN git checkout ${GIT_COMMIT}

# =============================================================================
# Stage 2b: Add deployment infrastructure from build context (user's repo)
# =============================================================================
FROM gmat-source AS gmat-source-deployments

# Copy deployment infrastructure from build context (user's repo, not NASA's)
COPY . /gmat/deployments/

# =============================================================================
# Stage 3: Native Linux build
# =============================================================================
FROM gmat-source-deployments AS native

# Apply source overlay patches (e.g., DeFile.hpp strcpy->memcpy fix)
RUN if [ -d /gmat/deployments/src ]; then cp -r /gmat/deployments/src/* /gmat/src/; fi

# Symlink CSPICE from /opt/spice to where GMAT expects it
RUN mkdir -p depends && \
    ln -s /opt/spice/depends/cspice depends/cspice

WORKDIR /gmat/deployments

# Configure and build native GMAT (GUI, console, and plugins)
RUN mkdir -p cmake-build && \
    cmake -S /gmat -B cmake-build \
      -DCMAKE_BUILD_TYPE=Release \
      -DGMAT_INCLUDE_GUI=ON \
      -DGMAT_BUILDOUTPUT_DIRECTORY=/gmat/deployments/application && \
    cmake --build cmake-build --parallel $(nproc)

# Create required runtime directories and copy config
RUN mkdir -p application/bin application/output application/plugins && \
    for f in gmat_startup_file.txt gmat_startup_file_mac_linux.txt \
             gmat_startup_file.public.txt gmat_startup_file_mac_linux.public.txt \
             GMAT.ini MacConfigure.txt; do \
      [ -f /gmat/application/bin/$f ] && cp /gmat/application/bin/$f application/bin/ || true; \
    done && \
    [ ! -e application/data ] && ln -s /gmat/application/data application/data || true && \
    [ ! -e application/samples ] && ln -s /gmat/application/samples application/samples || true

# Remove references to plugins that weren't built (proprietary, MATLAB, external)
# to prevent buffer overflows from failed plugin loads
RUN cd application/bin && \
    for f in gmat_startup_file.txt gmat_startup_file_mac_linux.txt; do \
      if [ -f "$f" ]; then \
        sed -i '/libMatlabInterface/d; /libFminconOptimizer/d' "$f" && \
        sed -i '/proprietary\//d' "$f" && \
        sed -i '/libOpenFramesInterface/d; /libOVtoOFI/d' "$f"; \
      fi; \
    done

# Verify the build
RUN ls -la application/bin/ && \
    echo "=== GMAT Native Build Complete ===" && \
    if [ -f application/bin/GmatConsole ] && [ -f application/bin/GMAT ]; then \
      echo "GmatConsole and GMAT GUI built successfully"; \
    else \
      echo "ERROR: Build incomplete"; \
      exit 1; \
    fi

# Move to short path to avoid GMAT buffer overflow on long paths
RUN mv /gmat/deployments/application /app

WORKDIR /app/bin
CMD ["./GmatConsole"]

# =============================================================================
# Stage 4: WebAssembly build
# =============================================================================
FROM gmat-source-deployments AS wasm-builder

WORKDIR /gmat/deployments

# Install Node.js from apt
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Emscripten via emsdk (apt version is too old)
# Note: Must use a version with arm64 Linux binaries (3.1.61+)
ENV EMSDK=/opt/emsdk
ENV EMSDK_VERSION=3.1.61
RUN git clone https://github.com/emscripten-core/emsdk.git ${EMSDK} && \
    cd ${EMSDK} && \
    ./emsdk install ${EMSDK_VERSION} && \
    ./emsdk activate ${EMSDK_VERSION}

# Set up Emscripten environment
ENV PATH="${EMSDK}:${EMSDK}/upstream/emscripten:${PATH}"

# Build WASM dependencies (CSPICE and Xerces-C for WebAssembly)
RUN bash web/build.sh --deps

# Configure and build GMAT for WebAssembly
RUN bash web/build.sh --configure
RUN bash web/build.sh --build

# Generate and assemble the web UI
RUN SRC_DIR=web/src && \
    npm install --prefix "$SRC_DIR/scripts" 2>/dev/null && \
    node "$SRC_DIR/scripts/generate-ui.mjs" "$SRC_DIR/ui-definition.yaml" && \
    mkdir -p web/ui web/ui/assets web/ui/core web/ui/base && \
    cp "$SRC_DIR/index.html" "$SRC_DIR/styles.css" "$SRC_DIR/ui-config.js" \
       "$SRC_DIR/main.js" "$SRC_DIR/sw.js" web/ui/ && \
    [ -d "$SRC_DIR/assets" ] && cp -r "$SRC_DIR/assets/"* web/ui/assets/ || true && \
    cp -r "$SRC_DIR/gui/"* web/ui/core/ && \
    cp -r "$SRC_DIR/base/"* web/ui/base/ && \
    mkdir -p web/out/ui/core web/out/ui/base web/out/ui/samples && \
    cp -r web/ui/* web/out/ui/ && \
    cp -r web/src/gui/* web/out/ui/core/ && \
    cp -r web/src/base/* web/out/ui/base/ && \
    grep -v '^#' web/samples_to_include.txt | grep -v '^$' | while read -r script; do \
      cp "/gmat/application/samples/${script}.script" web/out/ui/samples/ 2>/dev/null || true; \
    done && \
    echo "[" > web/out/ui/samples/samples.json && \
    grep -v '^#' web/samples_to_include.txt | grep -v '^$' | while read -r script; do \
      echo "  \"${script}.script\"," >> web/out/ui/samples/samples.json; \
    done && \
    sed -i '$ s/,$//' web/out/ui/samples/samples.json && \
    echo "]" >> web/out/ui/samples/samples.json

# Verify the web build
RUN ls -la web/out/ && \
    echo "=== GMAT Web Build Complete ===" && \
    if [ -f web/out/GmatConsole.js ] && [ -f web/out/GmatConsole.wasm ]; then \
      echo "WASM build successful"; \
      echo "  GmatConsole.js:   $(du -h web/out/GmatConsole.js | cut -f1)"; \
      echo "  GmatConsole.wasm: $(du -h web/out/GmatConsole.wasm | cut -f1)"; \
      echo "  GmatConsole.data: $(du -h web/out/GmatConsole.data | cut -f1)"; \
    else \
      echo "ERROR: WASM build files not found"; \
      exit 1; \
    fi

EXPOSE 8989

# Default: run web server
CMD ["node", "web/server.js"]

# =============================================================================
# Stage 5: Minimal WASM runtime image (just the built artifacts)
# =============================================================================
FROM node:20-slim AS wasm

LABEL description="GMAT WebAssembly Runtime"

# Build args for git info (passed via --build-arg)
ARG GIT_COMMIT=unknown
ARG GIT_COMMIT_FULL=unknown
ARG REPO_COMMIT_URL=

WORKDIR /gmat

# Copy only the built WASM output and server script (preserve path structure)
COPY --from=wasm-builder /gmat/deployments/web/out/ /gmat/deployments/web/out/
COPY --from=wasm-builder /gmat/deployments/web/server.js /gmat/deployments/web/server.js

# Bake git info into the image at build time
ENV PORT=8989
ENV ROOT_DIR=/gmat/deployments/web/out
ENV GIT_COMMIT=${GIT_COMMIT}
ENV GIT_COMMIT_FULL=${GIT_COMMIT_FULL}
ENV REPO_COMMIT_URL=${REPO_COMMIT_URL}

EXPOSE 8989

# Serve the WASM application with custom server
CMD ["node", "/gmat/deployments/web/server.js"]

# =============================================================================
# Stage 6: Combined image (can run either native or wasm) - DEFAULT
# =============================================================================
FROM gmat-source-deployments AS combined

WORKDIR /gmat/deployments

# Copy entrypoint script (already in image from source stage COPY)
RUN cp /gmat/deployments/entrypoint.sh /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Create runtime directories
RUN mkdir -p /gmat/deployments/application/output /gmat/deployments/application/docs/help

EXPOSE 8989

ENTRYPOINT ["/entrypoint.sh"]
CMD ["help"]
