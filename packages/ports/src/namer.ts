import { DEFAULT_WORDS } from "./word-list";

export function pickRandomPortName(
  usedNames: ReadonlySet<string>,
  port: number,
  words: readonly string[] = DEFAULT_WORDS,
): string {
  const availableWords = words.filter((word) => !usedNames.has(word));
  if (availableWords.length > 0) {
    const index = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[index];
    if (selectedWord) {
      return selectedWord;
    }
  }

  const baseWord = words[port % words.length] ?? "port";
  const deterministicName = `${baseWord}-${port}`;
  if (!usedNames.has(deterministicName)) {
    return deterministicName;
  }

  let suffix = 2;
  while (usedNames.has(`${deterministicName}-${suffix}`)) {
    suffix += 1;
  }

  return `${deterministicName}-${suffix}`;
}
