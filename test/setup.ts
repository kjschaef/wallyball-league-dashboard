import { JSDOM } from 'jsdom';
import { expect } from 'chai';

// Create a simplified JSDOM instance
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
});

// Simplified global setup for testing
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = { userAgent: 'node.js' };
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).getComputedStyle = dom.window.getComputedStyle;

// Mock requestAnimationFrame (needed for React)
(global.window as any).requestAnimationFrame = function(callback: Function) {
  return setTimeout(callback, 0);
};

// Mock cancelAnimationFrame
(global.window as any).cancelAnimationFrame = function(id: number) {
  clearTimeout(id);
};

// Mock matchMedia
Object.defineProperty(global.window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Make sure chai exists globally
(global as any).expect = expect;

// This suppresses React-specific warnings in the test output
const originalConsoleError = console.error;
console.error = (message: any, ...args: any[]) => {
  if (typeof message === 'string') {
    if (message.includes('React does not recognize the')) return;
    if (message.includes('Warning:')) return;
  }
  originalConsoleError(message, ...args);
};