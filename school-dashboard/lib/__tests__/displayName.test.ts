import getDisplayName from '../displayName';

describe('getDisplayName', () => {
  it('returns name when no preferred name is provided', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('John Doe');
  });

  it('returns name with preferred name when preferred name is provided', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      preferredName: 'Johnny',
      email: 'john@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('John Doe - (Johnny)');
  });

  it('returns empty string when user is undefined', () => {
    const result = getDisplayName(undefined);
    expect(result).toBe('');
  });

  it('returns empty string when user is null', () => {
    const result = getDisplayName(null);
    expect(result).toBe('');
  });

  it('handles user with empty name', () => {
    const user = {
      id: '1',
      name: '',
      email: 'john@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('');
  });

  it('handles user with empty preferred name', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      preferredName: '',
      email: 'john@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('John Doe');
  });

  it('handles user with null preferred name', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      preferredName: null,
      email: 'john@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('John Doe');
  });

  it('handles user with whitespace-only name', () => {
    const user = {
      id: '1',
      name: '   ',
      email: 'john@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('   ');
  });

  it('handles user with whitespace-only preferred name', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      preferredName: '   ',
      email: 'john@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('John Doe - (   )');
  });

  it('handles special characters in names', () => {
    const user = {
      id: '1',
      name: 'José María',
      preferredName: 'José',
      email: 'jose@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('José María - (José)');
  });

  it('handles long names', () => {
    const user = {
      id: '1',
      name: 'Alexander Hamilton Washington Jefferson',
      preferredName: 'Alex',
      email: 'alex@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('Alexander Hamilton Washington Jefferson - (Alex)');
  });

  it('handles numbers in names', () => {
    const user = {
      id: '1',
      name: 'John Doe Jr. III',
      preferredName: 'JD3',
      email: 'john@example.com',
    };

    const result = getDisplayName(user as any);
    expect(result).toBe('John Doe Jr. III - (JD3)');
  });
});