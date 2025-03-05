import { expect } from 'chai';
import { cn } from '../client/src/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2', { conditional: true, 'not-included': false });
      expect(result).to.equal('class1 class2 conditional');
    });

    it('should handle empty or falsy values', () => {
      const result = cn('base-class', '', undefined, null, false);
      expect(result).to.equal('base-class');
    });

    it('should handle array inputs', () => {
      const result = cn('base', ['array-class-1', 'array-class-2']);
      expect(result).to.include('base');
      expect(result).to.include('array-class-1');
      expect(result).to.include('array-class-2');
    });
  });
});