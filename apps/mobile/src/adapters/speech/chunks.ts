/** Bounded speech chunks without splitting a UTF-16 surrogate pair. */
export function speechChunks(parts: readonly string[]): string[] {
  return parts.flatMap((part) => {
    const chunks: string[] = [];
    let rest = part.trim();
    while (rest.length > 500) {
      let cut = rest.lastIndexOf(' ', 500);
      if (cut <= 0) cut = 500;
      const previous = rest.charCodeAt(cut - 1);
      if (previous >= 0xd800 && previous <= 0xdbff) cut--;
      chunks.push(rest.slice(0, cut)); rest = rest.slice(cut).trimStart();
    }
    if (rest) chunks.push(rest);
    return chunks;
  });
}
