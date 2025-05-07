import { cn } from '../../src/lib/utils';

jest.mock('clsx', () => ({
  clsx: (...args: any[]) => {
    return args.flat().map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return Object.entries(arg)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return arg;
    }).filter(Boolean).join(' ');
  }
}));

jest.mock('tailwind-merge', () => ({
  twMerge: (str: string) => str
}));

global.console.log = jest.fn();

describe('cn utility function', () => {
  test('should merge class names correctly', () => {
    expect(cn('test')).toBe('test');
    expect(cn('test1', 'test2')).toBe('test1 test2');
    expect(cn('test1', undefined, 'test2')).toBe('test1 test2');
    expect(cn('test1', false && 'test2')).toBe('test1');
    expect(cn('test1', true && 'test2')).toBe('test1 test2');
    expect(cn('test1', { 'test2': true, 'test3': false })).toBe('test1 test2');
  });

  test('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', {
      'active': isActive,
      'disabled': !isActive
    });
    expect(result).toBe('base active');
  });
});
