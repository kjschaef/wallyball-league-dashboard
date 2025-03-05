import { JSDOM } from 'jsdom';
import { expect } from 'chai';

// Set up JSDOM for React Testing Library
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true
});

// Extend the NodeJS.Global interface to add browser globals
declare global {
  namespace NodeJS {
    interface Global {
      window: Window & typeof globalThis;
      document: Document;
      navigator: Navigator;
      Element: typeof Element;
      HTMLElement: typeof HTMLElement;
      HTMLDivElement: typeof HTMLDivElement;
      HTMLButtonElement: typeof HTMLButtonElement;
      HTMLInputElement: typeof HTMLInputElement;
      HTMLImageElement: typeof HTMLImageElement;
      HTMLSelectElement: typeof HTMLSelectElement;
      Node: typeof Node;
      MouseEvent: typeof MouseEvent;
      KeyboardEvent: typeof KeyboardEvent;
      Event: typeof Event;
      getComputedStyle: typeof getComputedStyle;
      expect: typeof expect;
    }
  }
}

// Set up the global variables that would normally be available in a browser
global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLImageElement = dom.window.HTMLImageElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;
global.Node = dom.window.Node;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.Event = dom.window.Event;
global.getComputedStyle = dom.window.getComputedStyle;

Object.defineProperty(window, 'matchMedia', {
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