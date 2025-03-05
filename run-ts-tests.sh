#!/bin/bash

# Color codes for formatting output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running TypeScript tests...${NC}"

# Run specific TypeScript tests if provided as an argument
if [ "$1" == "db" ]; then
  echo -e "${YELLOW}Running database tests only...${NC}"
  npx mocha --require ts-node/register test/db/*.test.ts
elif [ "$1" == "api" ]; then
  echo -e "${YELLOW}Running API tests only...${NC}"
  npx mocha --require ts-node/register test/server/*.test.ts
elif [ "$1" == "components" ]; then
  echo -e "${YELLOW}Running component tests only...${NC}"
  npx mocha --require ts-node/register test/client/components/*.test.tsx
elif [ "$1" == "utils" ]; then
  echo -e "${YELLOW}Running utility tests only...${NC}"
  npx mocha --require ts-node/register test/utils.test.ts
else
  # Run all TypeScript tests
  echo -e "${YELLOW}Running all TypeScript tests...${NC}"
  npx mocha --require ts-node/register "test/**/*.test.ts" "test/**/*.test.tsx" 
fi

# Exit with the status of the last command
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Tests passed!${NC}"
else
  echo -e "${RED}Tests failed with exit code $EXIT_CODE${NC}"
fi
exit $EXIT_CODE