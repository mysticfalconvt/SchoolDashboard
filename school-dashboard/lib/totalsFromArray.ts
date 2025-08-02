interface TotalResult {
  word: string;
  total: number;
}

export default function totalsFromArray(
  wordList: string[],
  field: string,
  entries: Record<string, any>[],
): TotalResult[] {
  const totalPerClass = wordList.map((word) => {
    const total = entries.reduce((total, single) => {
      const included = single[field] === word;
      return total + (included ? 1 : 0);
    }, 0);
    return { word, total };
  });
  //   console.log(totalPerClass);
  return totalPerClass;
}
