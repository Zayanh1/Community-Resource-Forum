export default function addOrdinalSuffix(n: number) {
  const s = String(n);

  if (s.endsWith("1") && (s.length < 2 || s[s.length - 2] !== "1")) {
    return s + "st";
  }

  if (s.endsWith("2") && (s.length < 2 || s[s.length - 2] !== "1")) {
    return s + "nd";
  }

  if (s.endsWith("3") && (s.length < 2 || s[s.length - 2] !== "1")) {
    return s + "rd";
  }

  return s + "th";
}
