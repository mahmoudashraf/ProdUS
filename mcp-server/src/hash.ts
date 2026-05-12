import { createHash } from 'node:crypto';

function stable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stable);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = stable((value as Record<string, unknown>)[key]);
        }
        return result;
      }, {});
  }
  return value;
}

export function hashInput(value: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')}`;
}
