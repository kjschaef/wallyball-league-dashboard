import { cn } from '../utils';

describe('cn utility', () => {
  it('merges basic class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
  });

  it('merges object classes based on truthy values', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
  });

  it('handles arrays of class names', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('resolves tailwind class conflicts correctly', () => {
    // p-4 should override p-2
    expect(cn('p-2', 'p-4')).toBe('p-4');

    // text-red-500 should override text-blue-500
    expect(cn('text-blue-500 text-red-500')).toBe('text-red-500');

    // handles complex conflicting combinations
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
  });

  it('handles empty inputs safely', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn([])).toBe('');
    expect(cn({})).toBe('');
  });
});
