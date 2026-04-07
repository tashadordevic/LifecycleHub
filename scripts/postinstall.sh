#!/bin/bash
mkdir -p /usr/share/icons/hicolor/512x512/apps
cp /opt/LifecycleHub/resources/app/build/icon.png /usr/share/icons/hicolor/512x512/apps/lifecycle-hub.png
gtk-update-icon-cache /usr/share/icons/hicolor/ 2>/dev/null || true
