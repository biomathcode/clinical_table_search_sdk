export type DisplayObject<Df extends readonly string[]> = { [K in Df[number]]: string };

export function displayToObjects<Df extends readonly string[]>(
  df: Df,
  display: readonly (readonly string[])[],
): Array<DisplayObject<Df>> {
  return display.map((row) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < df.length; i++) {
      obj[df[i]!] = row[i] ?? "";
    }
    return obj as DisplayObject<Df>;
  });
}

