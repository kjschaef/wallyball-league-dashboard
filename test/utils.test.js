/**
 * Basic utility function tests
 * These tests validate the core testing infrastructure
 */

import { expect } from 'chai';
import { addNumbers, capitalizeString, filterArray } from './utils.js';

describe('Utility Functions', () => {
  describe('addNumbers()', () => {
    it('should add two positive numbers correctly', () => {
      expect(addNumbers(2, 3)).to.equal(5);
    });

    it('should handle negative numbers', () => {
      expect(addNumbers(-2, 3)).to.equal(1);
      expect(addNumbers(2, -3)).to.equal(-1);
      expect(addNumbers(-2, -3)).to.equal(-5);
    });

    it('should handle zero', () => {
      expect(addNumbers(0, 5)).to.equal(5);
      expect(addNumbers(5, 0)).to.equal(5);
      expect(addNumbers(0, 0)).to.equal(0);
    });
  });

  describe('capitalizeString()', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalizeString('hello')).to.equal('Hello');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalizeString('Hello')).to.equal('Hello');
    });

    it('should handle empty strings', () => {
      expect(capitalizeString('')).to.equal('');
    });

    it('should handle single character strings', () => {
      expect(capitalizeString('a')).to.equal('A');
    });
  });

  describe('filterArray()', () => {
    it('should filter an array based on a predicate', () => {
      const numbers = [1, 2, 3, 4, 5];
      const evenNumbers = filterArray(numbers, num => num % 2 === 0);
      expect(evenNumbers).to.deep.equal([2, 4]);
    });

    it('should handle empty arrays', () => {
      const emptyArray = [];
      const result = filterArray(emptyArray, item => true);
      expect(result).to.deep.equal([]);
    });

    it('should return an empty array when no items match the predicate', () => {
      const numbers = [1, 3, 5];
      const evenNumbers = filterArray(numbers, num => num % 2 === 0);
      expect(evenNumbers).to.deep.equal([]);
    });

    it('should return all items when all items match the predicate', () => {
      const numbers = [2, 4, 6];
      const evenNumbers = filterArray(numbers, num => num % 2 === 0);
      expect(evenNumbers).to.deep.equal([2, 4, 6]);
    });
  });
});