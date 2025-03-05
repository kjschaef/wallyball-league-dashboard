#!/bin/bash

# Function to display usage
function show_usage() {
  echo "Usage: ./run-tests.sh [options]"
  echo "Options:"
  echo "  all         - Run all tests"
  echo "  basic       - Run basic verification tests (JS only)"
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
  echo "Running all tests..."
  NODE_OPTIONS="--require ts-node/register" npx mocha
else
  case "$1" in
    "all")
      echo "Running all tests..."
      NODE_OPTIONS="--require ts-node/register" npx mocha
      ;;
    "basic")
      echo "Running basic JS tests only (no TypeScript)..."
      # Run without requiring the TypeScript setup
      npx mocha --no-config test/simple.test.js
      ;;
    "db")
      echo "Running database tests..."
      NODE_OPTIONS="--require ts-node/register" npx mocha test/db/**/*.test.ts
      ;;
    "server")
      echo "Running server API tests..."
      NODE_OPTIONS="--require ts-node/register" npx mocha test/server/**/*.test.ts
      ;;
    "client")
      echo "Running client component tests..."
      NODE_OPTIONS="--require ts-node/register" npx mocha test/client/**/*.test.tsx
      ;;
    "utils")
      echo "Running utility tests..."
      NODE_OPTIONS="--require ts-node/register" npx mocha test/utils.test.ts
      ;;
    "watch")
      echo "Running tests in watch mode..."
      NODE_OPTIONS="--require ts-node/register" npx mocha --watch
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