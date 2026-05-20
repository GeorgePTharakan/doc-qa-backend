export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const len = vecA.length;
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += vecA[i] * vecB[i];
  }
  let sum2A = 0
  for (let i = 0; i < len; i++) {
    sum2A += vecA[i] * vecA[i];
  }
  let sum2B = 0
  for (let i = 0; i < len; i++) {
    sum2B += vecB[i] * vecB[i];
  }

  const magnitudeA = Math.sqrt(sum2A);
  const magnitudeB = Math.sqrt(sum2B);

  return sum / (magnitudeA * magnitudeB);
};