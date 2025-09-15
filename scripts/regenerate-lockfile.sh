#!/usr/bin/env bash
set -euo pipefail

echo "Regenerate package-lock.json using the public npm registry"

# Show current registry
orig_registry=$(npm config get registry || true)
echo "Current npm registry: ${orig_registry}"

echo "Setting npm registry to https://registry.npmjs.org/"
npm config set registry https://registry.npmjs.org/

echo "Removing node_modules and package-lock.json"
rm -rf node_modules package-lock.json

echo "Verifying npm cache (may take a moment)"
npm cache verify || true

echo "Running npm install to regenerate package-lock.json"
npm install

echo "Checking for any remaining private registry references in package-lock.json"
if command -v rg >/dev/null 2>&1; then
  rg "cfa.jfrog.io|jfrog" -n package-lock.json || echo "no jfrog refs"
else
  grep -n "cfa.jfrog.io\|jfrog" package-lock.json || echo "no jfrog refs"
fi

echo "Done. If the lockfile changed, commit and push:"
echo "  git add package-lock.json"
echo "  git commit -m \"chore: regenerate package-lock using public npm registry\""
echo "  git push"

echo "If npm install failed because some packages are only available on a private registry, revert the registry change or configure authentication for that registry."

