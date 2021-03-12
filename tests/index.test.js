import expect from 'expect';
import sdk from '@percy/sdk-utils/test/helper';
import percySnapshot from '..';

sdk.testsite.mock();

fixture('percySnapshot')
  .page('http://localhost:8000')
  .beforeEach(() => sdk.setup())
  .afterEach(() => sdk.teardown())
  .after(() => sdk.testsite.close());

test('throws an error when a test is not provided', async () => {
  await expect(percySnapshot())
    .rejects.toThrow('The `test` argument is required.');
});

test('throws an error when a name is not provided', async t => {
  await expect(percySnapshot(t))
    .rejects.toThrow('The `name` argument is required.');
});

test('disables snapshots when the healthcheck fails', async t => {
  sdk.test.failure('/percy/healthcheck');

  await percySnapshot(t, 'Snapshot 1');
  await percySnapshot(t, 'Snapshot 2');

  expect(sdk.server.requests).toEqual([
    ['/percy/healthcheck']
  ]);

  expect(sdk.logger.stderr).toEqual([]);
  expect(sdk.logger.stdout).toEqual([
    '[percy] Percy is not running, disabling snapshots\n'
  ]);
});

test('posts snapshots to the local percy server', async t => {
  await percySnapshot(t, 'Snapshot 1');
  await percySnapshot(t, 'Snapshot 2');

  expect(sdk.server.requests).toEqual([
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

  expect(sdk.logger.stdout).toEqual([]);
  expect(sdk.logger.stderr).toEqual([]);
});

test('handles snapshot errors', async t => {
  sdk.test.failure('/percy/snapshot', 'failure');

  await percySnapshot(t, 'Snapshot 1');

  expect(sdk.logger.stdout).toEqual([]);
  expect(sdk.logger.stderr).toEqual([
    '[percy] Could not take DOM snapshot "Snapshot 1"\n',
    '[percy] Error: failure\n'
  ]);
});
