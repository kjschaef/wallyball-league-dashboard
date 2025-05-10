require('@testing-library/jest-dom');

global.fetch = jest.fn();

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
}
