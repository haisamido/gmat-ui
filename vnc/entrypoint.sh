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

# Wait for fluxbox window manager to be ready
while ! xdpyinfo -display :1 >/dev/null 2>&1; do sleep 0.2; done

# Launch applications
xterm &
cd /gmat/application/bin && ./GMAT 2>&1 | grep -v -E 'Glycin|pixman_region|_pixman_log_error|Gtk-CRITICAL.*width' &

# Set desktop wallpaper and re-apply on VNC client resize
WALLPAPER=/gmat/application/data/graphics/splash/GMATSplashScreen.png
PREV_RES=""
while true; do
  CUR_RES=$(xdpyinfo -display :1 2>/dev/null | awk '/dimensions:/{print $2}')
  if [ -n "$CUR_RES" ] && [ "$CUR_RES" != "$PREV_RES" ]; then
    sleep 1
    feh --bg-center --image-bg '#030355' "$WALLPAPER"
    PREV_RES="$CUR_RES"
  fi
  sleep 2
done
