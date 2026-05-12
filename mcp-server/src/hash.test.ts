import assert from 'node:assert/strict';
import test from 'node:test';
import { hashInput } from './hash.js';

test('hashInput is stable regardless of object key order', () => {
  assert.equal(hashInput({ b: 2, a: 1 }), hashInput({ a: 1, b: 2 }));
});

test('hashInput redacts token and secret fields before hashing', () => {
  const tokenHash = hashInput({ nested: { accessToken: 'one' }, value: 1 });
  const secretHash = hashInput({ nested: { accessToken: 'two' }, value: 1 });

  assert.equal(tokenHash, secretHash);
});
