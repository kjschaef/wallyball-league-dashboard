// ES module version of setup for JSDOM
import { JSDOM } from 'jsdom';
import { expect } from 'chai';

// Set up JSDOM for React Testing Library
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

// Set up global variables for JSDOM
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Required for some DOM operations in React components
global.window.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};

global.window.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// Make React Testing Library work with Chai's expect
global.expect = expect;

// Export to be imported where needed
export const jsdom = dom;