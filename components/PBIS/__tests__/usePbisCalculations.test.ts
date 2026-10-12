import { renderHook } from '@testing-library/react';
import { usePbisCalculations } from '../usePbisCalculations';

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('usePbisCalculations', () => {
  it('measures days since the newest collection even when dates arrive oldest first', () => {
    const pbisCollectionDates = [
      { id: 'old', collectionDate: daysAgo(400) },
      { id: 'mid', collectionDate: daysAgo(30) },
      { id: 'new', collectionDate: daysAgo(2.5) },
    ];
    const data = { pbisCollectionDates, pbisCardsCount: 0, taTeachers: [] };

    const { result } = renderHook(() => usePbisCalculations(data));

    expect(result.current.daysSinceLastCollection).toBe(3);
    expect(result.current.hasRecentCollection).toBe(true);
    // The query result is shared cache data and must not be reordered.
    expect(pbisCollectionDates.map((c) => c.id)).toEqual(['old', 'mid', 'new']);
  });
});
