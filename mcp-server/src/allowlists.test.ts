import assert from 'node:assert/strict';
import test from 'node:test';
import { isToolAllowedForProfile, loomAIProductizationTools } from './allowlists.js';

test('LoomAI productization profile exposes only approved core workflow tools', () => {
  const names = loomAIProductizationTools.map((tool) => tool.name);

  assert.ok(names.includes('produs.catalog.search'));
  assert.ok(names.includes('produs.scan.status'));
  assert.ok(names.includes('produs.evidence.upload_ci_result'));
  assert.ok(!names.includes('produs.team.profile.update'));
  assert.ok(!names.includes('produs.team.capability.add'));
  assert.ok(!names.includes('produs.proposal.submit'));
  assert.ok(!names.includes('produs.admin.catalog.create_category'));
});

test('isToolAllowedForProfile filters excluded team and admin tools', () => {
  assert.equal(isToolAllowedForProfile('all', 'produs.team.profile.update'), true);
  assert.equal(isToolAllowedForProfile('loomai-productization', 'produs.team.profile.update'), false);
  assert.equal(isToolAllowedForProfile('loomai-productization', 'produs.scan.status'), true);
  assert.equal(isToolAllowedForProfile('loomai-productization', 'produs.admin.notifications.dispatch'), false);
});

test('all LoomAI mutations require confirmation in descriptor metadata', () => {
  for (const tool of loomAIProductizationTools) {
    if (tool.mode === 'mutation') {
      assert.equal(tool.confirmationRequired, true, `${tool.name} must require confirmation`);
    }
  }
});
