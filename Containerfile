# GMAT Multi-Target Build Container
# Builds NASA's General Mission Analysis Tool for Native Linux and WebAssembly
#
# Stage hierarchy:
#
#   ubuntu:26.04 ──► gmat-base ──┬──► gmat-build-native ──► gmat-vnc
#                                ├──► gmat-build-web ──► gmat-web ◄── node:24-slim
#                                └──► gmat-combined
#

ARG GMAT_GIT_URL=https://github.com/nasa/GMAT
ARG GMAT_GIT_COMMIT=ce6eba2ee4a2da22e01522741d926d0c574173ff

# =============================================================================
# Stage 1: Base image with dependencies, GMAT source, and build context
# =============================================================================
FROM ubuntu:26.04 AS gmat-base

ARG TARGETARCH
ARG ARCH=${TARGETARCH}

#--- PROXY CONFIG (if needed)
ARG MAVEN_HTTPS_PROXY
ARG HTTPS_PROXY
ARG HTTP_PROXY
ARG NO_PROXY
ARG DEPLOYMENT_ENVIRO

ENV MAVEN_HTTPS_PROXY=${MAVEN_HTTPS_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV HTTP_PROXY=${HTTP_PROXY}
ENV NO_PROXY=${NO_PROXY}
ENV DEPLOYMENT_ENVIRO=${DEPLOYMENT_ENVIRO}

LABEL maintainer="haisamido"
LABEL description="GMAT Multi-Target Build Container (Native + VNC + WebAssembly)"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    netcat-traditional netcat-openbsd iputils-ping \
    jq tmux tree vim curl wget htop tshark && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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
    sudo \
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
    # OpenSceneGraph (for OpenFrames 3D visualization)
    libopenscenegraph-dev \
    # OSG runtime plugins (JPEG/PNG/FreeType readers for OpenFrames textures and fonts)
    openscenegraph \
    # Liberation fonts (Arial-compatible substitute for OpenFrames labels)
    fonts-liberation \
    # Python (for PythonInterface plugin)
    python3-dev \
    # SWIG (for API bindings)
    swig \
    && rm -rf /var/lib/apt/lists/*

# Symlink Liberation fonts as Microsoft font names (OpenFrames expects Arial + Courier Bold)
RUN ln -s /usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf \
    /usr/share/fonts/truetype/liberation/arial.ttf && \
    ln -s /usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf \
    /usr/share/fonts/truetype/liberation/courbd.ttf

# Install Task (go-task) build automation tool
RUN curl -sL https://taskfile.dev/install.sh | sh -s -- -b /usr/local/bin

# Download and build CSPICE for Linux (supports both amd64 and arm64)
WORKDIR /opt/spice
RUN mkdir -p depends/cspice/linux && \
    cd depends/cspice/linux && \
    if [ "$ARCH" = "amd64" ]; then \
        echo "=== Downloading pre-built CSPICE for amd64 ===" && \
        curl -sO https://naif.jpl.nasa.gov/pub/naif/misc/toolkit_N0067/C/PC_Linux_GCC_64bit/packages/cspice.tar.Z && \
        gzip -d cspice.tar.Z && \
        tar -xf cspice.tar && \
        mv cspice cspice64 && \
        rm -f cspice.tar; \
    elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then \
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


# Clone GMAT source and apply build context
WORKDIR /gmat

ARG GMAT_GIT_URL
ARG GMAT_GIT_COMMIT
RUN git clone --recurse-submodules -j4 ${GMAT_GIT_URL} .
RUN git checkout ${GMAT_GIT_COMMIT}
RUN git config --system --add safe.directory /gmat

# Copy build context (user's repo, not NASA's)
COPY . /gmat/build/

# Apply source overlay patches (e.g., DeFile.hpp strcpy->memcpy fix)
RUN if [ -d /gmat/build/src ]; then cp -r /gmat/build/src/* /gmat/src/; fi

# Create gmat user with sudo access (available to all downstream stages)
RUN useradd -m -s /bin/bash gmat && \
    usermod -aG sudo gmat && \
    echo "gmat ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/gmat && \
    chmod 0440 /etc/sudoers.d/gmat

# =============================================================================
# Stage 3: GMAT native build
# =============================================================================
FROM gmat-base AS gmat-build-native

# Symlink CSPICE from /opt/spice to where GMAT expects it
RUN mkdir -p depends && \
    ln -s /opt/spice/depends/cspice depends/cspice

# Build OpenFrames 3D visualization library
WORKDIR /opt/openframes
RUN git clone https://github.com/ravidavi/OpenFrames.git . && \
    mkdir build && cd build && \
    cmake .. \
      -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_INSTALL_PREFIX=/opt/openframes/install \
      -DOF_FORTRAN_MODULE=OFF \
      -DOF_PYTHON_MODULE=OFF \
      -DOF_QT_MODULE=OFF \
      -DOF_VR_MODULE=OFF \
      -DOF_BUILD_DEMOS=OFF && \
    cmake --build . --parallel $(nproc) && \
    cmake --install .

# Clone OpenFramesInterface GMAT plugin
WORKDIR /opt/openframes-interface
RUN git clone https://gitlab.com/EmergentSpaceTechnologies/OpenFramesInterface.git . && \
    echo "OpenFramesInterface=/opt/openframes-interface" > /gmat/ListOfAdditionalPlugins.txt

WORKDIR /gmat/build

# Configure and build native GMAT (GUI, console, and plugins including OpenFrames)
RUN mkdir -p cmake-build && \
    cmake -S /gmat -B cmake-build \
      -DCMAKE_BUILD_TYPE=Release \
      -DGMAT_INCLUDE_GUI=ON \
      -DGMAT_BUILDOUTPUT_DIRECTORY=/gmat/application \
      -DPLUGIN_OPENFRAMESINTERFACE=ON \
      -DOPENFRAMESINTERFACE_USE_OSGEARTH=OFF \
      -DOPENFRAMES_DIR=/opt/openframes/install \
      -DOPENFRAMES_INCLUDE_DIR=/opt/openframes/install/include \
      -DOPENFRAMES_LIBRARY=/opt/openframes/install/lib/libOpenFrames.so \
      -DOPENSCENEGRAPH_INCLUDE_DIRS=/usr/include \
      -DGMAT_ADDITIONAL_PLUGINS=/gmat/ListOfAdditionalPlugins.txt \
      -DGMAT_PYTHON314_ROOT_DIR=/usr && \
    cmake --build cmake-build --parallel $(nproc)

# Copy OpenFramesInterface data to GMAT paths (shaders, textures, stars)
RUN cp /opt/openframes-interface/data/shader/*.frag /gmat/application/data/graphics/texture/ && \
    cp /opt/openframes-interface/data/texture/*.jpg /gmat/application/data/graphics/texture/ && \
    cp /opt/openframes-interface/data/stars/inp_StarsHYGv3.txt /gmat/application/data/graphics/stars/

# Create runtime directories (cmake populates bin/ and plugins/ directly)
RUN mkdir -p /gmat/application/output /gmat/application/plugins

# Copy OpenFrames shared libraries to the application plugins directory
RUN cp /opt/openframes/install/lib/lib*.so* /gmat/application/plugins/ 2>/dev/null || true

# Remove references to plugins that weren't built (proprietary, MATLAB,
# non-matching Python versions) to prevent errors from failed plugin loads
RUN cd /gmat/application/bin && \
    for f in gmat_startup_file.txt gmat_startup_file_mac_linux.txt; do \
      if [ -f "$f" ]; then \
        sed -i '/libMatlabInterface/d; /libFminconOptimizer/d' "$f" && \
        sed -i '/proprietary\//d' "$f" && \
        sed -i '/libPythonInterface_py3[0-9]/{/libPythonInterface_py314/!d}' "$f" && \
        sed -i '/libExternalForceModel_py3[0-9]/{/libExternalForceModel_py314/!d}' "$f"; \
      fi; \
    done

# Create help directory (GMAT GUI expects ../docs/help/ to exist)
RUN mkdir -p /gmat/application/docs/help

# Verify the build
RUN ls -la /gmat/application/bin/ && \
    echo "=== GMAT Native Build Complete ===" && \
    if [ -f /gmat/application/bin/GmatConsole ] && [ -f /gmat/application/bin/GMAT ]; then \
      echo "GmatConsole and GMAT GUI built successfully"; \
    else \
      echo "ERROR: Build incomplete"; \
      exit 1; \
    fi

# Give gmat user ownership of the built application directory
RUN chown -R gmat:gmat /gmat/application

ENV LD_LIBRARY_PATH=/gmat/application/plugins:${LD_LIBRARY_PATH}
ENV OSG_FILE_PATH=/gmat/application/data:/usr/share/fonts/truetype/liberation
RUN MULTIARCH=$(dpkg-architecture -qDEB_HOST_MULTIARCH) && \
    echo "export OSG_LIBRARY_PATH=/usr/lib/$MULTIARCH" > /etc/profile.d/gmat-osg.sh && \
    chmod +x /etc/profile.d/gmat-osg.sh

USER gmat
ENV HOME=/home/gmat

WORKDIR /gmat/application/bin
CMD ["bash", "-c", "source /etc/profile.d/gmat-osg.sh && exec ./GmatConsole"]

# =============================================================================
# Stage 3b: Native with VNC (browser-accessible 3D visualization)
# =============================================================================
FROM gmat-build-native AS gmat-vnc

# Package installs require root (gmat-build-native stage ends as USER gmat)
USER root

# Install X server and window manager
RUN apt-get update && apt-get install -y --no-install-recommends \
    xorg \
    xterm \
    fluxbox \
    feh \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install TurboVNC (TARGETARCH is set automatically by Docker buildx)
ARG TARGETARCH
RUN curl -fsSL -o /tmp/turbovnc.deb \
    "https://github.com/TurboVNC/turbovnc/releases/download/3.1.2/turbovnc_3.1.2_${TARGETARCH}.deb" && \
    apt-get update && apt-get install -y -f /tmp/turbovnc.deb && \
    rm -f /tmp/turbovnc.deb && rm -rf /var/lib/apt/lists/*

# Install noVNC and websockify
RUN git clone --depth 1 https://github.com/novnc/noVNC.git /usr/share/novnc && \
    pip3 install --break-system-packages websockify && \
    sed -i "s/UI.initSetting('resize', 'off')/UI.initSetting('resize', 'remote')/" /usr/share/novnc/app/ui.js

# Install additional tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        chromium-browser && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Ensure /tmp/.X11-unix exists, gmat owns its home, and fontconfig cache is built
RUN mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix && \
    mkdir -p /home/gmat/.cache/fontconfig && \
    chown -R gmat:gmat /home/gmat && \
    fc-cache -f

# Switch to gmat user for remaining setup
USER gmat

# VNC password setup
ARG VNC_PASSWORD=gmat
ENV VNC_PASSWORD=${VNC_PASSWORD}
RUN mkdir -p ~/.vnc && \
    echo "$VNC_PASSWORD" | /opt/TurboVNC/bin/vncpasswd -f > ~/.vnc/passwd && \
    chmod 0600 ~/.vnc/passwd

# SSL certificate for noVNC
RUN openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout ~/novnc.pem -out ~/novnc.pem -days 3650 \
    -subj "/C=US/ST=MD/L=Greenbelt/O=GMAT/CN=localhost"

# Fluxbox config
RUN mkdir -p ~/.fluxbox
COPY --chown=gmat:gmat vnc/fluxbox/ /home/gmat/.fluxbox/

# GMAT desktop shortcut
RUN mkdir -p ~/Desktop
COPY --chown=gmat:gmat vnc/GMAT.desktop /home/gmat/Desktop/GMAT.desktop
RUN chmod +x ~/Desktop/GMAT.desktop

# Shell config
COPY --chown=gmat:gmat vnc/bashrc /home/gmat/.bashrc
COPY vnc/bashrc /root/.bashrc

# VNC entrypoint
COPY --chown=gmat:gmat vnc/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]

# =============================================================================
# Stage 4: WebAssembly build
# =============================================================================
FROM gmat-base AS gmat-build-web

WORKDIR /gmat/build

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
FROM node:24-slim AS gmat-web

LABEL description="GMAT WebAssembly (WASM) Runtime"

# Build args for git info (passed via --build-arg)
ARG GMAT_GIT_COMMIT=unknown
ARG GMAT_GIT_COMMIT_FULL=unknown
ARG REPO_COMMIT_URL=

WORKDIR /gmat

# Copy only the built WASM output and server script (preserve path structure)
COPY --from=gmat-build-web /gmat/build/web/out/ /gmat/build/web/out/
COPY --from=gmat-build-web /gmat/build/web/server.js /gmat/build/web/server.js

# Bake git info into the image at build time
ENV PORT=8989
ENV ROOT_DIR=/gmat/build/web/out
ENV GMAT_GIT_COMMIT=${GMAT_GIT_COMMIT}
ENV GMAT_GIT_COMMIT_FULL=${GMAT_GIT_COMMIT_FULL}
ENV REPO_COMMIT_URL=${REPO_COMMIT_URL}

EXPOSE 8989

# Serve the WASM application with custom server
CMD ["node", "/gmat/build/web/server.js"]

# =============================================================================
# Stage 6: Combined image (can run either gmat-build-native or wasm) - DEFAULT
# =============================================================================
FROM gmat-base AS gmat-combined

WORKDIR /gmat/build

# Copy entrypoint script (already in image from source stage COPY)
RUN cp /gmat/build/entrypoint.sh /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Create runtime directories
RUN mkdir -p /gmat/build/application/output /gmat/build/application/docs/help

EXPOSE 8989

ENTRYPOINT ["/entrypoint.sh"]
CMD ["help"]
