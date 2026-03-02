export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix: number[][] = Array.from({ length: len2 + 1 }, () =>
    Array.from({ length: len1 + 1 }, () => 0)
  );

  // init première ligne
  const row0 = matrix[0]!;
  for (let j = 0; j <= len1; j++) row0[j] = j;

  // init première colonne
  for (let i = 0; i <= len2; i++) {
    matrix[i]![0] = i;
  }

  for (let i = 1; i <= len2; i++) {
    const row = matrix[i]!;
    const prevRow = matrix[i - 1]!;
    for (let j = 1; j <= len1; j++) {
      const cost = str2.charCodeAt(i - 1) === str1.charCodeAt(j - 1) ? 0 : 1;
      const substitution = prevRow[j - 1]! + cost;
      const insertion = row[j - 1]! + 1;
      const deletion = prevRow[j]! + 1;
      row[j] = Math.min(substitution, insertion, deletion);
    }
  }

  return matrix[len2]![len1]!;
}

export default { levenshteinDistance };
