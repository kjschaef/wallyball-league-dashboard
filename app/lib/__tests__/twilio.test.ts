import { parseSmsResponse } from '../twilio';

describe('parseSmsResponse', () => {
  const daysCount = 3; // E.g., Tue, Thu, Sat

  it('correctly parses individual selected numbers', () => {
    expect(parseSmsResponse('1', daysCount)).toEqual({
      rsvpIn: [0],
      rsvpOut: [1, 2],
    });

    expect(parseSmsResponse('2', daysCount)).toEqual({
      rsvpIn: [1],
      rsvpOut: [0, 2],
    });

    expect(parseSmsResponse('3', daysCount)).toEqual({
      rsvpIn: [2],
      rsvpOut: [0, 1],
    });
  });

  it('correctly parses multiple numbers with space or comma separators', () => {
    expect(parseSmsResponse('1 2', daysCount)).toEqual({
      rsvpIn: [0, 1],
      rsvpOut: [2],
    });

    expect(parseSmsResponse('1, 3', daysCount)).toEqual({
      rsvpIn: [0, 2],
      rsvpOut: [1],
    });

    expect(parseSmsResponse('1,2,3', daysCount)).toEqual({
      rsvpIn: [0, 1, 2],
      rsvpOut: [],
    });
  });

  it('correctly parses unspaced number sequences like "12"', () => {
    expect(parseSmsResponse('12', daysCount)).toEqual({
      rsvpIn: [0, 1],
      rsvpOut: [2],
    });

    expect(parseSmsResponse('23', daysCount)).toEqual({
      rsvpIn: [1, 2],
      rsvpOut: [0],
    });
  });

  it('handles lowercase inputs and extra whitespace', () => {
    expect(parseSmsResponse('  1   3  ', daysCount)).toEqual({
      rsvpIn: [0, 2],
      rsvpOut: [1],
    });
  });

  it('correctly parses ALL/YES/Y keywords', () => {
    expect(parseSmsResponse('all', daysCount)).toEqual({
      rsvpIn: [0, 1, 2],
      rsvpOut: [],
    });

    expect(parseSmsResponse('YES', daysCount)).toEqual({
      rsvpIn: [0, 1, 2],
      rsvpOut: [],
    });

    expect(parseSmsResponse('y', daysCount)).toEqual({
      rsvpIn: [0, 1, 2],
      rsvpOut: [],
    });
  });

  it('correctly parses NONE/OUT/NO/N keywords', () => {
    expect(parseSmsResponse('none', daysCount)).toEqual({
      rsvpIn: [],
      rsvpOut: [0, 1, 2],
    });

    expect(parseSmsResponse('OUT', daysCount)).toEqual({
      rsvpIn: [],
      rsvpOut: [0, 1, 2],
    });

    expect(parseSmsResponse('no', daysCount)).toEqual({
      rsvpIn: [],
      rsvpOut: [0, 1, 2],
    });

    expect(parseSmsResponse('n', daysCount)).toEqual({
      rsvpIn: [],
      rsvpOut: [0, 1, 2],
    });
  });

  it('ignores numbers outside the openDaysCount range', () => {
    expect(parseSmsResponse('4', daysCount)).toBeNull();
    
    expect(parseSmsResponse('1 4', daysCount)).toEqual({
      rsvpIn: [0],
      rsvpOut: [1, 2],
    });
  });

  it('returns null for completely unrecognized responses', () => {
    expect(parseSmsResponse('hello', daysCount)).toBeNull();
    expect(parseSmsResponse('maybe tomorrow', daysCount)).toBeNull();
    expect(parseSmsResponse('i can play', daysCount)).toBeNull();
  });
});
