#!/bin/bash

# Function to display usage
function show_usage() {
  echo "Usage: ./run-tests.sh [options]"
  echo "Options:"
  echo "  all         - Run all tests"
  echo "  db          - Run database tests"
  echo "  server      - Run server API tests"
  echo "  client      - Run client component tests"
  echo "  utils       - Run utility function tests"
  echo "  watch       - Run all tests in watch mode"
  echo "  help        - Show this help message"
}

# Run tests based on argument using TS-Node directly
if [ $# -eq 0 ]; then
  # Default: run all tests
  npx ts-node node_modules/mocha/bin/mocha.js
else
  case "$1" in
    "all")
      npx ts-node node_modules/mocha/bin/mocha.js
      ;;
    "db")
      npx ts-node node_modules/mocha/bin/mocha.js test/db/**/*.test.ts
      ;;
    "server")
      npx ts-node node_modules/mocha/bin/mocha.js test/server/**/*.test.ts
      ;;
    "client")
      npx ts-node node_modules/mocha/bin/mocha.js test/client/**/*.test.tsx
      ;;
    "utils")
      npx ts-node node_modules/mocha/bin/mocha.js test/utils.test.ts
      ;;
    "watch")
      npx ts-node node_modules/mocha/bin/mocha.js --watch
      ;;
    "help")
      show_usage
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
fi