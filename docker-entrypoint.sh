#!/bin/sh
set -e

cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-}",
  VITE_SOCKET_URL: "${VITE_SOCKET_URL:-}"
};
EOF

exec "$@"
