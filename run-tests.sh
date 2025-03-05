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

# Run tests based on argument
if [ $# -eq 0 ]; then
  # Default: run all tests
  npx mocha
else
  case "$1" in
    "all")
      npx mocha
      ;;
    "db")
      npx mocha test/db/**/*.test.ts
      ;;
    "server")
      npx mocha test/server/**/*.test.ts
      ;;
    "client")
      npx mocha test/client/**/*.test.ts
      ;;
    "utils")
      npx mocha test/utils.test.ts
      ;;
    "watch")
      npx mocha --watch
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