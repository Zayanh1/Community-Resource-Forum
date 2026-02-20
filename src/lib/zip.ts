export default function zip<T, R>(arr1: T[], arr2: R[]): [T, R][] {
  if (arr1.length !== arr2.length) {
    throw new Error("Arrays must be of the same length.");
  }

  return arr1.map((v, i) => [v, arr2[i]!]);
}
