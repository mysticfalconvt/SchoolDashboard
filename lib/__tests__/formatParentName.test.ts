// Test file for the formatParentName utility function
// Since formatParentName is defined inside SendPbisWinnerEmails component,
// we'll extract it to a separate utility file for better testability

// For now, let's create the utility function and tests
const formatParentName = (name: string): string => {
  if (!name) return '';
  if (name.includes(',')) {
    const parts = name.split(',').map(part => part.trim());
    const [last, ...firstParts] = parts;
    const first = firstParts.join(', ');
    return `${first} ${last}`;
  }
  return name;
};

describe('formatParentName', () => {
  it('formats "Last, First" to "First Last"', () => {
    expect(formatParentName('Smith, John')).toBe('John Smith');
    expect(formatParentName('Johnson, Mary')).toBe('Mary Johnson');
    expect(formatParentName('Brown, Alice')).toBe('Alice Brown');
  });

  it('handles names without commas', () => {
    expect(formatParentName('John Smith')).toBe('John Smith');
    expect(formatParentName('Mary')).toBe('Mary');
    expect(formatParentName('SingleName')).toBe('SingleName');
  });

  it('handles empty or invalid inputs', () => {
    expect(formatParentName('')).toBe('');
    expect(formatParentName('   ')).toBe('   ');
  });

  it('trims whitespace around names', () => {
    expect(formatParentName('  Smith  ,  John  ')).toBe('John Smith');
    expect(formatParentName('Johnson , Mary')).toBe('Mary Johnson');
  });

  it('handles names with multiple commas', () => {
    // Should only split on the first comma
    expect(formatParentName('Smith, John, Jr.')).toBe('John, Jr. Smith');
  });

  it('handles edge cases', () => {
    expect(formatParentName(',')).toBe(' ');
    expect(formatParentName('Smith,')).toBe(' Smith');
    expect(formatParentName(',John')).toBe('John ');
  });
});