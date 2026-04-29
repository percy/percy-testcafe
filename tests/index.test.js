import expect from 'expect';
import helpers from '@percy/sdk-utils/test/helpers';
import { waitForPercyIdle } from '@percy/sdk-utils';
import percySnapshot from '..';

fixture('percySnapshot')
  .page(helpers.testSnapshotURL)
  .beforeEach(() => helpers.setupTest())
  .after(async () => await waitForPercyIdle());

test('throws an error when a test is not provided', async () => {
  await expect(percySnapshot())
    .rejects.toThrow("The test function's `t` argument is required.");
});

test('throws an error when a name is not provided', async t => {
  await expect(percySnapshot(t))
    .rejects.toThrow('The `name` argument is required.');
});

test('disables snapshots when the healthcheck fails', async t => {
  await helpers.test('error', '/percy/healthcheck');

  await percySnapshot(t, 'Snapshot 1');
  await percySnapshot(t, 'Snapshot 2');

  expect(helpers.logger.stdout).toEqual(expect.arrayContaining([
    '[percy] Percy is not running, disabling snapshots'
  ]));
});

test('posts snapshots to the local percy server', async t => {
  await percySnapshot(t, 'Snapshot 1');
  await percySnapshot(t, 'Snapshot 2');

  // format is http://192.168.0.104:57634/VsZiT1t2l*stFMYCMD1/https://www.example.com/
  const urlRegex = new RegExp(
    `- url: http://.*:.*/.*/${helpers.testSnapshotURL}`
  );

  expect(await helpers.get('logs')).toEqual(expect.arrayContaining([
    'Snapshot found: Snapshot 1',
    'Snapshot found: Snapshot 2',
    expect.stringMatching(urlRegex),
    expect.stringMatching(/clientInfo: @percy\/testcafe\/.+/),
    expect.stringMatching(/environmentInfo: testcafe\/.+/)
  ]));
});

test('handles snapshot errors', async t => {
  await helpers.test('error', '/percy/snapshot');
  await percySnapshot(t, 'Snapshot 1');

  expect(helpers.logger.stderr).toEqual(expect.arrayContaining([
    '[percy] Could not take DOM snapshot "Snapshot 1"'
  ]));
});

// Readiness gate (PER-7348)
//
// PercyDOM is fetched from /percy/dom.js during percySnapshot. The mock
// served by @percy/sdk-utils/test/helpers does not expose waitForReady,
// so the SDK's `typeof PercyDOM.waitForReady === 'function'` guard short-
// circuits and the snapshot path proceeds as before. These tests verify
// that the readiness gate does not break the existing flow on either the
// happy path or when the user explicitly disables readiness.
test('does not break snapshot when CLI does not expose waitForReady (backward compat)', async t => {
  await percySnapshot(t, 'Snapshot 1');

  expect(await helpers.get('logs')).toEqual(expect.arrayContaining([
    'Snapshot found: Snapshot 1'
  ]));
});

test('skips waitForReady when readiness.preset is disabled', async t => {
  await percySnapshot(t, 'Snapshot 1', { readiness: { preset: 'disabled' } });

  expect(await helpers.get('logs')).toEqual(expect.arrayContaining([
    'Snapshot found: Snapshot 1'
  ]));
  expect(helpers.logger.stderr).not.toEqual(expect.arrayContaining([
    expect.stringContaining('Could not take DOM snapshot')
  ]));
});

test('still posts a snapshot when a readiness config is supplied (waitForReady absent on stub)', async t => {
  await percySnapshot(t, 'Snapshot 1', {
    readiness: { preset: 'balanced', stabilityWindowMs: 100, timeoutMs: 1000 }
  });

  expect(await helpers.get('logs')).toEqual(expect.arrayContaining([
    'Snapshot found: Snapshot 1'
  ]));
});
