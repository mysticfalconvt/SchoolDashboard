interface TrueTotalResult {
  item: string;
  totals: number;
}

export default function totalsTrueInArray(
  array: string[],
  dataToCheck: Record<string, boolean>[],
): TrueTotalResult[] {
  return array.map((item) => {
    const totals = dataToCheck.reduce((total, single) => {
      const included = single[item] === true;
      return total + (included ? 1 : 0);
    }, 0);
    return { item, totals };
  });
}
