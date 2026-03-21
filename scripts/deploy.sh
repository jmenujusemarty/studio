#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

git push origin main
git push hetzner main

echo "Deploy push complete (origin + hetzner)."
