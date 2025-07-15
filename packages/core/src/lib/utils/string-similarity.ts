export const MIN_MATCH_THRESHOLD = 0.45;

/**
 * Calculates the Levenshtein distance between two strings
 * @param a First string
 * @param b Second string
 * @returns Number of edits needed to transform a into b
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix with zeros
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = new Array<number>(a.length + 1).fill(0);
  }

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let i = 0; i <= b.length; i++) matrix[i][0] = i;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * NOTE: mostly AI gen'd double check & test in the future
 * Finds the most similar string in an array to a target string
 * @param target The string to find a match for
 * @param candidates Array of strings to search through
 * @returns The most similar string from candidates
 */
export function findClosestMatch(
  target: string,
  candidates: string[],
): [string, number] {
  if (candidates.length === 0) return [target, 0];

  // Normalize strings for comparison
  const normalizedTarget = target.toLowerCase().trim();
  const normalizedCandidates = candidates.map((c) => c.toLowerCase().trim());

  // Find the candidate with the smallest Levenshtein distance
  let minDistance = Infinity;
  let bestMatch = candidates[0];

  for (let i = 0; i < normalizedCandidates.length; i++) {
    const distance = levenshteinDistance(
      normalizedTarget,
      normalizedCandidates[i],
    );
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = candidates[i];
    }
  }

  const score = similarityScore(target, bestMatch);

  return [bestMatch, score];
}

/**
 * Calculates similarity score between two strings (0 to 1, where 1 is identical)
 * @param a First string
 * @param b Second string
 * @returns Similarity score between 0 and 1
 */
function similarityScore(a: string, b: string): number {
  const distance = levenshteinDistance(
    a.toLowerCase().trim(),
    b.toLowerCase().trim(),
  );
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}
