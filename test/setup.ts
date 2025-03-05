import { JSDOM } from 'jsdom';
import { expect } from 'chai';

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

// Required for some DOM operations in React components
(global.window as any).requestAnimationFrame = function(callback: Function) {
  return setTimeout(callback, 0);
};

(global.window as any).cancelAnimationFrame = function(id: number) {
  clearTimeout(id);
};

// Make React Testing Library work with Chai's expect
// This is needed for the .toBeInTheDocument() and similar assertions
(global as any).expect = expect;