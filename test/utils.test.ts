import { expect } from 'chai';

// Simple utility functions to test
function addNumbers(a: number, b: number): number {
  return a + b;
}

function capitalizeString(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function filterArray<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return arr.filter(predicate);
}

describe('Utility Functions', () => {
  describe('addNumbers', () => {
    it('should add two positive numbers correctly', () => {
      expect(addNumbers(2, 3)).to.equal(5);
    });

    it('should handle negative numbers', () => {
      expect(addNumbers(-1, -2)).to.equal(-3);
      expect(addNumbers(-5, 10)).to.equal(5);
    });
  });

  describe('capitalizeString', () => {
    it('should capitalize the first letter and lowercase the rest', () => {
      expect(capitalizeString('hello')).to.equal('Hello');
      expect(capitalizeString('WORLD')).to.equal('World');
      expect(capitalizeString('javaScript')).to.equal('Javascript');
    });

    it('should handle empty strings', () => {
      expect(capitalizeString('')).to.equal('');
    });
  });

  describe('filterArray', () => {
    it('should filter numbers correctly', () => {
      const numbers = [1, 2, 3, 4, 5, 6];
      const evenNumbers = filterArray(numbers, n => n % 2 === 0);
      expect(evenNumbers).to.deep.equal([2, 4, 6]);
    });

    it('should filter strings correctly', () => {
      const fruits = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
      const shortFruits = filterArray(fruits, f => f.length <= 5);
      expect(shortFruits).to.deep.equal(['apple', 'date']);
    });
  });
});