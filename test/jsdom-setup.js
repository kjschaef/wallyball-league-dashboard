// ES module version of setup for JSDOM
import { JSDOM } from 'jsdom';
import { expect } from 'chai';
import path from 'path';
import { fileURLToPath } from 'url';

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
global.Node = dom.window.Node;
global.NodeList = dom.window.NodeList;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.Event = dom.window.Event;
global.history = dom.window.history;
global.location = dom.window.location;

// Add polyfills for browser APIs
global.MutationObserver = class {
  constructor(callback) {}
  disconnect() {}
  observe(element, options) {}
};

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

// Required for React operations
global.window.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};

global.window.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// Mock media queries
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

// Add Jest-like mocking capabilities
global.jest = {
  mock: (modulePath, mockImplementation) => {
    const mockModuleName = modulePath.split('/').pop();
    global[mockModuleName] = mockImplementation();
  }
};

// Function to create a mock implementation
global.createMockImplementation = (implementation) => {
  return () => implementation;
};

// Make React Testing Library work with Chai's expect
global.expect = expect;

// In-memory fetch mock implementation
global.fetch = async (url, options = {}) => {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  };
};

// Export to be imported where needed
export const jsdom = dom;