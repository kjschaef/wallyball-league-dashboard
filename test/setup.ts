import { JSDOM } from 'jsdom';
import { expect } from 'chai';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up JSDOM for React Testing Library
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

// Set up global variables for JSDOM
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Mock CSS modules
(global.window as any).CSS = { supports: () => true };

// Set up path resolution for client-side imports
global.__dirname = __dirname;
global.__filename = __filename;

// Required for some DOM operations in React components
(global.window as any).requestAnimationFrame = function(callback: Function) {
  return setTimeout(callback, 0);
};

(global.window as any).cancelAnimationFrame = function(id: number) {
  clearTimeout(id);
};

// Mock browser fetch API
global.fetch = async () => {
  return {
    json: async () => ({}),
    text: async () => '',
    ok: true,
    status: 200,
    headers: new Headers(),
  } as Response;
};

// Make React Testing Library work with Chai's expect
// This is needed for the .toBeInTheDocument() and similar assertions
(global as any).expect = expect;

// Mock matchMedia for responsive testing
(global.window as any).matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
});