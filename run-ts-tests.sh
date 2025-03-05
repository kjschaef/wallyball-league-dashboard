#!/bin/bash

# Color codes for formatting output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running TypeScript tests...${NC}"

# Define common Mocha options
MOCHA_COMMON_OPTIONS="--require ts-node/register --require test/jsdom-setup.js --require test/setup.ts --node-option=experimental-specifier-resolution=node --node-option=loader=ts-node/esm"

# Create node options for paths
export NODE_OPTIONS="--experimental-vm-modules --experimental-specifier-resolution=node"

# Run JavaScript tests only
run_js_tests() {
  echo -e "${BLUE}Running JavaScript tests...${NC}"
  npx mocha test/utils.test.js
  return $?
}

# Run specific TypeScript tests if provided as an argument
if [ "$1" == "db" ]; then
  echo -e "${YELLOW}Running database tests only...${NC}"
  npx mocha $MOCHA_COMMON_OPTIONS test/db/*.test.ts
elif [ "$1" == "api" ]; then
  echo -e "${YELLOW}Running API tests only...${NC}"
  npx mocha $MOCHA_COMMON_OPTIONS test/server/*.test.ts
elif [ "$1" == "components" ]; then
  echo -e "${YELLOW}Running component tests only...${NC}"
  npx mocha $MOCHA_COMMON_OPTIONS test/client/components/*.test.tsx
elif [ "$1" == "utils" ]; then
  echo -e "${YELLOW}Running utility tests only...${NC}"
  npx mocha $MOCHA_COMMON_OPTIONS test/utils.test.ts
elif [ "$1" == "js" ]; then
  run_js_tests
else
  # Run all tests
  echo -e "${YELLOW}Running all tests...${NC}"
  
  # First run JavaScript tests
  run_js_tests
  JS_EXIT_CODE=$?
  
  if [ $JS_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}JavaScript tests passed!${NC}"
  else
    echo -e "${RED}JavaScript tests failed with exit code $JS_EXIT_CODE${NC}"
    exit $JS_EXIT_CODE
  fi
  
  # Then run TypeScript tests
  npx mocha $MOCHA_COMMON_OPTIONS "test/**/*.test.ts" "test/**/*.test.tsx"
  TS_EXIT_CODE=$?
  
  if [ $TS_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}TypeScript tests passed!${NC}"
  else
    echo -e "${RED}TypeScript tests failed with exit code $TS_EXIT_CODE${NC}"
    exit $TS_EXIT_CODE
  fi
  
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi

# Exit with the status of the last command
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Tests passed!${NC}"
else
  echo -e "${RED}Tests failed with exit code $EXIT_CODE${NC}"
fi
exit $EXIT_CODE