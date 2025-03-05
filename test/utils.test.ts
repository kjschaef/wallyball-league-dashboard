import { expect } from 'chai';
import { cn } from '../client/src/lib/utils';

// Testing utility functions
describe('Utility Functions', () => {
  describe('cn (class name utility)', () => {
    it('should combine multiple class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).to.equal('class1 class2 class3');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded');
      expect(result).to.equal('base included');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).to.equal('base valid');
    });
  });
});