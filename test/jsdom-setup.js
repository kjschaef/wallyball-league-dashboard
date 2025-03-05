// ES module version of setup for JSDOM
import { JSDOM } from 'jsdom';
import { expect } from 'chai';
import path from 'path';
import { fileURLToPath } from 'url';
import { register } from 'module';

// Register path aliases for import resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Set up module alias resolution
const aliasMap = {
  "@/": path.join(projectRoot, "client/src"),
  "@db/": path.join(projectRoot, "db"),
  "@db": path.join(projectRoot, "db", "index.ts"),
  "@test/": path.join(projectRoot, "test")
};

// Set up JSDOM for React Testing Library
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  runScripts: 'dangerously'
});

// Set up global variables for JSDOM
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.history = dom.window.history;
global.location = dom.window.location;

// CSS support mocks
global.window.CSS = { supports: () => true };
global.CSSStyleSheet = class {
  constructor() { this.cssRules = []; }
  insertRule() { return 0; }
};

// Mock local storage
global.localStorage = {
  getItem: () => null,
  setItem: () => null,
  removeItem: () => null,
  clear: () => null,
  key: () => null,
  length: 0
};

// Required for some DOM operations in React components
global.window.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};

global.window.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// Mock media queries for responsive design testing
global.window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
});

// Make React Testing Library work with Chai's expect
global.expect = expect;

// Export to be imported where needed
export const jsdom = dom;