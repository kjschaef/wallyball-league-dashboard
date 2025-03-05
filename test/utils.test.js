import { expect } from 'chai';
import { addNumbers, capitalizeString, filterArray } from './utils.js';

describe('Utils Library', () => {
  describe('addNumbers', () => {
    it('should add two positive numbers correctly', () => {
      expect(addNumbers(2, 3)).to.equal(5);
    });

    it('should handle negative numbers', () => {
      expect(addNumbers(-1, -2)).to.equal(-3);
      expect(addNumbers(-5, 10)).to.equal(5);
    });

    it('should handle zero', () => {
      expect(addNumbers(0, 5)).to.equal(5);
      expect(addNumbers(5, 0)).to.equal(5);
      expect(addNumbers(0, 0)).to.equal(0);
    });
  });

  describe('capitalizeString', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalizeString('hello')).to.equal('Hello');
    });

    it('should not change already capitalized strings', () => {
      expect(capitalizeString('Hello')).to.equal('Hello');
    });

    it('should handle empty strings', () => {
      expect(capitalizeString('')).to.equal('');
    });

    it('should handle null and undefined', () => {
      expect(capitalizeString(null)).to.equal(null);
      expect(capitalizeString(undefined)).to.equal(undefined);
    });
  });

  describe('filterArray', () => {
    it('should filter arrays based on a predicate', () => {
      const numbers = [1, 2, 3, 4, 5];
      const evenNumbers = filterArray(numbers, num => num % 2 === 0);
      expect(evenNumbers).to.deep.equal([2, 4]);
    });

    it('should return an empty array when no items match', () => {
      const numbers = [1, 3, 5];
      const evenNumbers = filterArray(numbers, num => num % 2 === 0);
      expect(evenNumbers).to.deep.equal([]);
    });

    it('should handle empty arrays', () => {
      const empty = [];
      const result = filterArray(empty, () => true);
      expect(result).to.deep.equal([]);
    });

    it('should handle non-array inputs', () => {
      expect(filterArray(null, () => true)).to.deep.equal([]);
      expect(filterArray(undefined, () => true)).to.deep.equal([]);
      expect(filterArray('not an array', () => true)).to.deep.equal([]);
    });
  });
});