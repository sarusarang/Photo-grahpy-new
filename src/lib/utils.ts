export function cn(...inputs: (string | boolean | undefined | null | Record<string, boolean | undefined | null> | any[])[]): string {
  const result: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      result.push(input);
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) result.push(nested);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) result.push(key);
      }
    }
  }

  return result.join(' ');
}
