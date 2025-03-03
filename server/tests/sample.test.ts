/**
 * Sample test file to verify Mocha/Chai setup
 */
import { expect, resetStubs } from './testUtils.js';

// Basic test suite 
describe('Sample Tests', () => {
  // Reset stubs after each test
  afterEach(() => {
    resetStubs();
  });

  // A simple test case
  it('should pass a basic test', () => {
    expect(true).to.equal(true);
  });

  // A simple async test case
  it('should support async tests', async () => {
    const result = await Promise.resolve(42);
    expect(result).to.equal(42);
  });

  // Testing basic numerical operations
  describe('Math operations', () => {
    it('should add two numbers correctly', () => {
      expect(1 + 1).to.equal(2);
    });

    it('should subtract two numbers correctly', () => {
      expect(5 - 2).to.equal(3);
    });
  });
});