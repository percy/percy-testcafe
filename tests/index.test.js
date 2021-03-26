import expect from 'expect';
import helpers from '@percy/sdk-utils/test/helpers';
import percySnapshot from '..';

helpers.mockSite();

fixture('percySnapshot')
  .page('http://localhost:8000')
  .beforeEach(() => helpers.setup())
  .afterEach(() => helpers.teardown())
  .after(() => helpers.closeSite());

test('throws an error when a test is not provided', async () => {
  await expect(percySnapshot())
    .rejects.toThrow("The test function's `t` argument is required.");
});

test('throws an error when a name is not provided', async t => {
  await expect(percySnapshot(t))
    .rejects.toThrow('The `name` argument is required.');
});

test('disables snapshots when the healthcheck fails', async t => {
  await helpers.testFailure('/percy/healthcheck');

  await percySnapshot(t, 'Snapshot 1');
  await percySnapshot(t, 'Snapshot 2');

  await expect(helpers.getRequests()).resolves.toEqual([
    ['/percy/healthcheck']
  ]);

  expect(helpers.logger.stderr).toEqual([]);
  expect(helpers.logger.stdout).toEqual([
    '[percy] Percy is not running, disabling snapshots'
  ]);
});

test('posts snapshots to the local percy server', async t => {
  await percySnapshot(t, 'Snapshot 1');
  await percySnapshot(t, 'Snapshot 2');

  await expect(helpers.getRequests()).resolves.toEqual([
    ['/percy/healthcheck'],
    ['/percy/dom.js'],
    ['/percy/snapshot', {
      name: 'Snapshot 1',
      url: 'http://localhost:8000/',
      domSnapshot: '<html><head></head><body>Snapshot Me</body></html>',
      clientInfo: expect.stringMatching(/@percy\/testcafe\/.+/),
      environmentInfo: expect.stringMatching(/testcafe\/.+/)
    }],
    ['/percy/snapshot', expect.objectContaining({
      name: 'Snapshot 2'
    })]
  ]);

  expect(helpers.logger.stdout).toEqual([]);
  expect(helpers.logger.stderr).toEqual([]);
});

test('handles snapshot errors', async t => {
  await helpers.testFailure('/percy/snapshot', 'failure');

  await percySnapshot(t, 'Snapshot 1');

  expect(helpers.logger.stdout).toEqual([]);
  expect(helpers.logger.stderr).toEqual([
    '[percy] Could not take DOM snapshot "Snapshot 1"',
    '[percy] Error: failure'
  ]);
});
