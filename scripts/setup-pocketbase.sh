#!/bin/bash
# Downloads PocketBase binary and initializes the pb/ directory.
# Usage: bash scripts/setup-pocketbase.sh

set -e

PB_VERSION="0.25.9"
PB_DIR="$(dirname "$0")/../pb"
mkdir -p "$PB_DIR"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
  x86_64)  ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)       echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

if [ "$OS" = "darwin" ]; then
  FILENAME="pocketbase_${PB_VERSION}_darwin_${ARCH}.zip"
elif [ "$OS" = "linux" ]; then
  FILENAME="pocketbase_${PB_VERSION}_linux_${ARCH}.zip"
else
  echo "Unsupported OS: $OS"; exit 1
fi

URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${FILENAME}"

if [ -f "$PB_DIR/pocketbase" ]; then
  echo "PocketBase binary already exists at $PB_DIR/pocketbase"
  echo "Delete it first if you want to re-download."
  exit 0
fi

echo "Downloading PocketBase v${PB_VERSION} for ${OS}/${ARCH}..."
curl -fSL "$URL" -o "/tmp/${FILENAME}"

echo "Extracting to $PB_DIR..."
unzip -o "/tmp/${FILENAME}" -d "$PB_DIR"
rm "/tmp/${FILENAME}"

chmod +x "$PB_DIR/pocketbase"
echo "PocketBase installed at $PB_DIR/pocketbase"
echo ""
echo "Start it with:"
echo "  cd pb && ./pocketbase serve"
