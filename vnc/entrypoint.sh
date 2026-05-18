#!/usr/bin/env bash

# Suppress Glycin sandbox warning (bubblewrap unavailable in containers)
export GLYCIN_SANDBOX=false

# Suppress GTK/pixman warnings from software renderer (cosmetic, no functional impact)
export GDK_BACKEND=x11
export MESA_LOG_LEVEL=error

# Start VNC server
/opt/TurboVNC/bin/vncserver -geometry 1920x1080 -securitytypes tlsnone,x509none,none

# Start websockify (sudo for privileged port 80)
sudo python3 -m websockify -D \
    --web=/usr/share/novnc/ \
    --cert=$HOME/novnc.pem 80 localhost:5901

# Set up environment for GUI applications
export DISPLAY=:1
export LD_LIBRARY_PATH=/gmat/application/plugins:${LD_LIBRARY_PATH}
MULTIARCH=$(dpkg-architecture -qDEB_HOST_MULTIARCH)
export OSG_LIBRARY_PATH=/usr/lib/$MULTIARCH
export OSG_FILE_PATH=/gmat/application/data:/usr/share/fonts/truetype/liberation

# Set desktop wallpaper (after fluxbox has started via vncserver)
feh --bg-center --image-bg '#030355' /gmat/application/data/graphics/splash/GMATSplashScreen.png

# Launch applications
xterm &
cd /gmat/application/bin && ./GMAT 2>&1 | grep -v -E 'Glycin|pixman_region|_pixman_log_error|Gtk-CRITICAL.*width' &

tail -f /dev/null
