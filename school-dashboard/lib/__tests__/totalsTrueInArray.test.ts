import totalsTrueInArray from '../totalsTrueInArray';

describe('totalsTrueInArray', () => {
  it('counts true values for specified properties', () => {
    const items = ['isActive', 'isVerified', 'isAdmin'];
    const data = [
      { isActive: true, isVerified: false, isAdmin: false },
      { isActive: true, isVerified: true, isAdmin: false },
      { isActive: false, isVerified: true, isAdmin: true },
      { isActive: true, isVerified: false, isAdmin: false },
    ];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'isActive', totals: 3 },
      { item: 'isVerified', totals: 2 },
      { item: 'isAdmin', totals: 1 },
    ]);
  });

  it('returns zero counts when no items are true', () => {
    const items = ['isActive', 'isVerified'];
    const data = [
      { isActive: false, isVerified: false },
      { isActive: false, isVerified: false },
    ];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'isActive', totals: 0 },
      { item: 'isVerified', totals: 0 },
    ]);
  });

  it('handles empty items array', () => {
    const items: string[] = [];
    const data = [
      { isActive: true, isVerified: false },
      { isActive: false, isVerified: true },
    ];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([]);
  });

  it('handles empty data array', () => {
    const items = ['isActive', 'isVerified'];
    const data: Record<string, boolean>[] = [];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'isActive', totals: 0 },
      { item: 'isVerified', totals: 0 },
    ]);
  });

  it('handles properties that do not exist in data objects', () => {
    const items = ['isActive', 'nonExistent'];
    const data = [
      { isActive: true, isVerified: false },
      { isActive: false, isVerified: true },
    ];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'isActive', totals: 1 },
      { item: 'nonExistent', totals: 0 },
    ]);
  });

  it('only counts strictly true values, not truthy values', () => {
    const items = ['prop1', 'prop2', 'prop3', 'prop4'];
    const data = [
      { prop1: true, prop2: 1, prop3: 'true', prop4: {} },
      { prop1: false, prop2: 0, prop3: '', prop4: null },
    ];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'prop1', totals: 1 }, // only true counts
      { item: 'prop2', totals: 0 }, // 1 is truthy but not true
      { item: 'prop3', totals: 0 }, // 'true' string is truthy but not true
      { item: 'prop4', totals: 0 }, // object is truthy but not true
    ]);
  });

  it('handles undefined and null values', () => {
    const items = ['isActive', 'isVerified'];
    const data = [
      { isActive: true, isVerified: undefined },
      { isActive: null, isVerified: true },
      { isActive: false, isVerified: null },
    ];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'isActive', totals: 1 },
      { item: 'isVerified', totals: 1 },
    ]);
  });

  it('maintains order of items array in results', () => {
    const items = ['zebra', 'alpha', 'beta'];
    const data = [
      { alpha: true, beta: false, zebra: true },
      { alpha: false, beta: true, zebra: false },
    ];

    const result = totalsTrueInArray(items, data);

    // Should maintain the order from items array
    expect(result.map(r => r.item)).toEqual(['zebra', 'alpha', 'beta']);
    expect(result).toEqual([
      { item: 'zebra', totals: 1 },
      { item: 'alpha', totals: 1 },
      { item: 'beta', totals: 1 },
    ]);
  });

  it('handles real-world user permissions example', () => {
    const permissions = ['canRead', 'canWrite', 'canDelete', 'canAdmin'];
    const users = [
      { canRead: true, canWrite: true, canDelete: false, canAdmin: false },
      { canRead: true, canWrite: false, canDelete: false, canAdmin: false },
      { canRead: true, canWrite: true, canDelete: true, canAdmin: false },
      { canRead: true, canWrite: true, canDelete: true, canAdmin: true },
    ];

    const result = totalsTrueInArray(permissions, users);

    expect(result).toEqual([
      { item: 'canRead', totals: 4 }, // All users can read
      { item: 'canWrite', totals: 3 }, // 3 users can write
      { item: 'canDelete', totals: 2 }, // 2 users can delete
      { item: 'canAdmin', totals: 1 }, // 1 user is admin
    ]);
  });

  it('handles feature flags example', () => {
    const features = ['darkMode', 'notifications', 'betaFeatures'];
    const userSettings = [
      { darkMode: true, notifications: false, betaFeatures: false },
      { darkMode: false, notifications: true, betaFeatures: false },
      { darkMode: true, notifications: true, betaFeatures: true },
      { darkMode: true, notifications: false, betaFeatures: false },
    ];

    const result = totalsTrueInArray(features, userSettings);

    expect(result).toEqual([
      { item: 'darkMode', totals: 3 },
      { item: 'notifications', totals: 2 },
      { item: 'betaFeatures', totals: 1 },
    ]);
  });

  it('handles large datasets efficiently', () => {
    const features = ['feature1', 'feature2', 'feature3'];
    const data = Array.from({ length: 1000 }, (_, i) => ({
      feature1: i % 2 === 0, // 500 true values
      feature2: i % 3 === 0, // ~333 true values
      feature3: i % 5 === 0, // 200 true values
    }));

    const result = totalsTrueInArray(features, data);

    expect(result).toEqual([
      { item: 'feature1', totals: 500 },
      { item: 'feature2', totals: 334 }, // 0, 3, 6, 9... up to 999
      { item: 'feature3', totals: 200 }, // 0, 5, 10, 15... up to 995
    ]);
  });

  it('handles objects with mixed property types', () => {
    const items = ['boolProp', 'stringProp', 'numberProp'];
    const data = [
      { boolProp: true, stringProp: 'hello', numberProp: 123 },
      { boolProp: false, stringProp: true, numberProp: true }, // only stringProp and numberProp are actually true
      { boolProp: true, stringProp: false, numberProp: 0 },
    ];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'boolProp', totals: 2 },
      { item: 'stringProp', totals: 1 }, // only the middle object has true
      { item: 'numberProp', totals: 1 }, // only the middle object has true
    ]);
  });

  it('handles single item and single data object', () => {
    const items = ['isEnabled'];
    const data = [{ isEnabled: true }];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'isEnabled', totals: 1 },
    ]);
  });

  it('handles boolean false values correctly', () => {
    const items = ['isActive'];
    const data = [
      { isActive: false },
      { isActive: false },
      { isActive: true },
      { isActive: false },
    ];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'isActive', totals: 1 },
    ]);
  });

  it('handles data objects with additional unrelated properties', () => {
    const items = ['isPublic', 'isActive'];
    const data = [
      { 
        isPublic: true, 
        isActive: false,
        name: 'Item 1',
        createdAt: '2023-01-01',
        tags: ['tag1', 'tag2'],
        metadata: { version: 1 }
      },
      { 
        isPublic: false, 
        isActive: true,
        name: 'Item 2',
        createdAt: '2023-01-02',
        priority: 'high'
      },
    ];

    const result = totalsTrueInArray(items, data);

    expect(result).toEqual([
      { item: 'isPublic', totals: 1 },
      { item: 'isActive', totals: 1 },
    ]);
  });
});