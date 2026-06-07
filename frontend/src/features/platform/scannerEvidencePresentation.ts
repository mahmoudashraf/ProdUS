const entityMap: Record<string, string> = {
  amp: '&',
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
  '#39': "'",
};

export const scannerEvidenceText = (value?: string) => {
  if (!value) return '';

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&([a-zA-Z0-9#]+);/g, (match, entity) => entityMap[entity] || match)
    .replace(/\s+/g, ' ')
    .trim();
};
