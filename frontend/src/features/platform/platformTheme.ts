export const appleColors = {
  ink: '#101828',
  muted: '#64748b',
  line: '#dbe4f0',
  panel: '#ffffff',
  wash: '#f7faff',
  purple: '#625cff',
  blue: '#1877f2',
  cyan: '#0ea5c6',
  green: '#13a66b',
  amber: '#f59e0b',
  red: '#ef4444',
};

export const categoryPalette = [
  { accent: '#625cff', bg: '#f1efff', soft: '#f8f7ff' },
  { accent: '#1877f2', bg: '#eaf3ff', soft: '#f7fbff' },
  { accent: '#f59e0b', bg: '#fff4dc', soft: '#fffaf1' },
  { accent: '#0ea5c6', bg: '#e4f9fd', soft: '#f5fdff' },
  { accent: '#06a4b7', bg: '#dcf7fa', soft: '#f4fdfe' },
  { accent: '#ef4444', bg: '#ffe9ec', soft: '#fff7f8' },
  { accent: '#16a34a', bg: '#e7f8ee', soft: '#f6fff9' },
  { accent: '#7c3aed', bg: '#f1e9ff', soft: '#fbf8ff' },
];

const labelAcronyms = new Set([
  'AI',
  'API',
  'CI/CD',
  'JWT',
  'MCP',
  'QA',
  'RBAC',
  'S3',
  'SLA',
  'SSO',
  'UAT',
  'URL',
]);

export const formatLabel = (value?: string | null) => {
  if (!value) return 'Not Set';

  return value
    .replaceAll('_', ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => {
      const upper = word.toUpperCase();
      if (labelAcronyms.has(upper)) return upper;
      return word.toLowerCase().replace(/^\w/, letter => letter.toUpperCase());
    })
    .join(' ');
};

export const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

export const errorMessageFromUnknown = (
  error: unknown,
  fallback = 'The request could not be completed.'
) => {
  if (!error) return fallback;

  const responseData =
    typeof error === 'object' && error !== null && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    const data = responseData as Record<string, unknown>;
    for (const key of ['message', 'error', 'detail', 'title']) {
      const value = data[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    if (data.errors && typeof data.errors === 'object') {
      const validationMessages = Object.entries(data.errors as Record<string, unknown>).flatMap(
        ([field, value]) => {
          if (Array.isArray(value)) {
            return value.map(item => `${formatLabel(field)}: ${String(item)}`);
          }
          if (typeof value === 'string') {
            return [`${formatLabel(field)}: ${value}`];
          }
          return [];
        }
      );
      if (validationMessages.length > 0) {
        return validationMessages.join(' ');
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};
