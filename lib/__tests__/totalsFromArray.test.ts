import totalsFromArray from '../totalsFromArray';

describe('totalsFromArray', () => {
  it('counts occurrences of words in a field', () => {
    const wordList = ['apple', 'banana', 'orange'];
    const entries = [
      { fruit: 'apple', quantity: 5 },
      { fruit: 'banana', quantity: 3 },
      { fruit: 'apple', quantity: 2 },
      { fruit: 'orange', quantity: 1 },
      { fruit: 'apple', quantity: 4 },
    ];

    const result = totalsFromArray(wordList, 'fruit', entries);

    expect(result).toEqual([
      { word: 'apple', total: 3 },
      { word: 'banana', total: 1 },
      { word: 'orange', total: 1 },
    ]);
  });

  it('returns zero count for words not found in entries', () => {
    const wordList = ['apple', 'banana', 'orange', 'grape'];
    const entries = [
      { fruit: 'apple', quantity: 5 },
      { fruit: 'banana', quantity: 3 },
    ];

    const result = totalsFromArray(wordList, 'fruit', entries);

    expect(result).toEqual([
      { word: 'apple', total: 1 },
      { word: 'banana', total: 1 },
      { word: 'orange', total: 0 },
      { word: 'grape', total: 0 },
    ]);
  });

  it('handles empty word list', () => {
    const wordList: string[] = [];
    const entries = [
      { fruit: 'apple', quantity: 5 },
      { fruit: 'banana', quantity: 3 },
    ];

    const result = totalsFromArray(wordList, 'fruit', entries);

    expect(result).toEqual([]);
  });

  it('handles empty entries array', () => {
    const wordList = ['apple', 'banana', 'orange'];
    const entries: Record<string, any>[] = [];

    const result = totalsFromArray(wordList, 'fruit', entries);

    expect(result).toEqual([
      { word: 'apple', total: 0 },
      { word: 'banana', total: 0 },
      { word: 'orange', total: 0 },
    ]);
  });

  it('handles field that does not exist in entries', () => {
    const wordList = ['apple', 'banana'];
    const entries = [
      { vegetable: 'carrot', quantity: 5 },
      { vegetable: 'potato', quantity: 3 },
    ];

    const result = totalsFromArray(wordList, 'fruit', entries);

    expect(result).toEqual([
      { word: 'apple', total: 0 },
      { word: 'banana', total: 0 },
    ]);
  });

  it('handles case-sensitive matching', () => {
    const wordList = ['Apple', 'apple', 'APPLE'];
    const entries = [
      { fruit: 'apple', quantity: 5 },
      { fruit: 'Apple', quantity: 3 },
      { fruit: 'APPLE', quantity: 2 },
    ];

    const result = totalsFromArray(wordList, 'fruit', entries);

    expect(result).toEqual([
      { word: 'Apple', total: 1 },
      { word: 'apple', total: 1 },
      { word: 'APPLE', total: 1 },
    ]);
  });

  it('handles numeric field values', () => {
    const wordList = ['1', '2', '3'];
    const entries = [
      { level: '1', name: 'beginner' },
      { level: '2', name: 'intermediate' },
      { level: '1', name: 'beginner2' },
      { level: '3', name: 'advanced' },
    ];

    const result = totalsFromArray(wordList, 'level', entries);

    expect(result).toEqual([
      { word: '1', total: 2 },
      { word: '2', total: 1 },
      { word: '3', total: 1 },
    ]);
  });

  it('handles boolean field values as strings', () => {
    const wordList = ['true', 'false'];
    const entries = [
      { active: 'true', name: 'user1' },
      { active: 'false', name: 'user2' },
      { active: 'true', name: 'user3' },
    ];

    const result = totalsFromArray(wordList, 'active', entries);

    expect(result).toEqual([
      { word: 'true', total: 2 },
      { word: 'false', total: 1 },
    ]);
  });

  it('handles null and undefined values in entries', () => {
    const wordList = ['apple', 'banana'];
    const entries = [
      { fruit: 'apple', quantity: 5 },
      { fruit: null, quantity: 3 },
      { fruit: undefined, quantity: 2 },
      { fruit: 'banana', quantity: 1 },
    ];

    const result = totalsFromArray(wordList, 'fruit', entries);

    expect(result).toEqual([
      { word: 'apple', total: 1 },
      { word: 'banana', total: 1 },
    ]);
  });

  it('handles objects with missing field', () => {
    const wordList = ['apple', 'banana'];
    const entries = [
      { fruit: 'apple', quantity: 5 },
      { quantity: 3 }, // missing fruit field
      { fruit: 'banana', quantity: 1 },
    ];

    const result = totalsFromArray(wordList, 'fruit', entries);

    expect(result).toEqual([
      { word: 'apple', total: 1 },
      { word: 'banana', total: 1 },
    ]);
  });

  it('handles real-world PBIS card categories example', () => {
    const categories = ['respect', 'responsibility', 'perseverance', 'quick'];
    const cards = [
      { category: 'respect', student: 'John', points: 5 },
      { category: 'responsibility', student: 'Jane', points: 3 },
      { category: 'respect', student: 'Bob', points: 4 },
      { category: 'perseverance', student: 'Alice', points: 2 },
      { category: 'respect', student: 'Charlie', points: 1 },
      { category: 'quick', student: 'David', points: 3 },
    ];

    const result = totalsFromArray(categories, 'category', cards);

    expect(result).toEqual([
      { word: 'respect', total: 3 },
      { word: 'responsibility', total: 1 },
      { word: 'perseverance', total: 1 },
      { word: 'quick', total: 1 },
    ]);
  });

  it('handles large datasets efficiently', () => {
    const wordList = ['type1', 'type2', 'type3'];
    const entries = Array.from({ length: 1000 }, (_, i) => ({
      type: `type${(i % 3) + 1}`,
      id: i,
    }));

    const result = totalsFromArray(wordList, 'type', entries);

    expect(result).toEqual([
      { word: 'type1', total: 334 }, // 0, 3, 6, 9... (334 times)
      { word: 'type2', total: 333 }, // 1, 4, 7, 10... (333 times)
      { word: 'type3', total: 333 }, // 2, 5, 8, 11... (333 times)
    ]);
  });

  it('handles special characters in word list and entries', () => {
    const wordList = ['@special', '#hashtag', '$money'];
    const entries = [
      { category: '@special', value: 1 },
      { category: '#hashtag', value: 2 },
      { category: '@special', value: 3 },
    ];

    const result = totalsFromArray(wordList, 'category', entries);

    expect(result).toEqual([
      { word: '@special', total: 2 },
      { word: '#hashtag', total: 1 },
      { word: '$money', total: 0 },
    ]);
  });

  it('maintains order of word list in results', () => {
    const wordList = ['zebra', 'apple', 'banana'];
    const entries = [
      { animal: 'apple', count: 1 },
      { animal: 'zebra', count: 2 },
      { animal: 'banana', count: 3 },
    ];

    const result = totalsFromArray(wordList, 'animal', entries);

    // Should maintain the order from wordList, not alphabetical
    expect(result.map(r => r.word)).toEqual(['zebra', 'apple', 'banana']);
    expect(result).toEqual([
      { word: 'zebra', total: 1 },
      { word: 'apple', total: 1 },
      { word: 'banana', total: 1 },
    ]);
  });

  it('handles entries with additional unrelated fields', () => {
    const wordList = ['red', 'blue', 'green'];
    const entries = [
      { color: 'red', size: 'large', price: 10.99, available: true },
      { color: 'blue', size: 'medium', price: 8.99, available: false },
      { color: 'red', size: 'small', price: 6.99, available: true },
    ];

    const result = totalsFromArray(wordList, 'color', entries);

    expect(result).toEqual([
      { word: 'red', total: 2 },
      { word: 'blue', total: 1 },
      { word: 'green', total: 0 },
    ]);
  });
});