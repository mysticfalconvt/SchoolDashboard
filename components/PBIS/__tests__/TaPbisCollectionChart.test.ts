import { getTaPbisCollectionPoints } from "../TaPbisCollectionChart";

describe("getTaPbisCollectionPoints", () => {
  it("groups cards by the actual PBIS collection windows", () => {
    const points = getTaPbisCollectionPoints(
      [
        {
          allCards: [
            { dateGiven: "2026-09-02T12:00:00.000Z" },
            { dateGiven: "2026-09-08T12:00:00.000Z" },
          ],
        },
        {
          allCards: [
            { dateGiven: "2026-09-03T12:00:00.000Z" },
            { dateGiven: "2026-09-20T12:00:00.000Z" },
          ],
        },
      ],
      [
        { collectionDate: "2026-09-10T16:00:00.000Z" },
        { collectionDate: "2026-09-04T16:00:00.000Z" },
        { collectionDate: "2026-09-18T16:00:00.000Z" },
      ],
      25,
    );

    expect(points.map((point) => point.cards)).toEqual([2, 1, 0]);
    expect(points.map((point) => point.cardsPerStudent)).toEqual([1, 0.5, 0]);
    expect(points.at(-1)).toMatchObject({
      cumulativeCardsPerStudent: 25,
      level: 1,
    });
  });

  it("ignores cards that have not been collected yet", () => {
    const points = getTaPbisCollectionPoints(
      [{ allCards: [{ dateGiven: "2026-09-20T12:00:00.000Z" }] }],
      [{ collectionDate: "2026-09-18T16:00:00.000Z" }],
      10,
    );

    expect(points[0].cards).toBe(0);
    expect(points[0].cumulativeCardsPerStudent).toBe(10);
  });
});
