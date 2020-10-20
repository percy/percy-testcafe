import expect from 'expect';
import sdk from '@percy/sdk-utils/test/helper';
import percySnapshot from '..';

sdk.testsite.mock();

fixture('percySnapshot')
  .page('http://localhost:8000')
  .beforeEach(() => sdk.setup())
  .afterEach(() => sdk.teardown())
  .after(() => sdk.testsite.close());

test('throws an error when a name is not provided', async () => {
  await expect(percySnapshot())
    .rejects.toThrow('The `name` argument is required.');
});

test('disables snapshots when the healthcheck fails', async () => {
  sdk.test.failure('/percy/healthcheck');

  await sdk.stdio(async () => {
    await percySnapshot('Snapshot 1');
    await percySnapshot('Snapshot 2');
  });

  expect(sdk.server.requests).toEqual([
    ['/percy/healthcheck']
  ]);

  expect(sdk.stdio[2]).toHaveLength(0);
  expect(sdk.stdio[1]).toEqual([
    '[percy] Percy is not running, disabling snapshots\n'
  ]);
});

test('posts snapshots to the local percy server', async () => {
  await sdk.stdio(async () => {
    await percySnapshot('Snapshot 1');
    await percySnapshot('Snapshot 2');
  });

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

  expect(sdk.stdio[2]).toEqual([]);
});

test('handles snapshot errors', async () => {
  sdk.test.failure('/percy/snapshot', 'failure');

  await sdk.stdio(async () => {
    await percySnapshot('Snapshot 1');
  });

  expect(sdk.stdio[1]).toHaveLength(0);
  expect(sdk.stdio[2]).toEqual([
    '[percy] Could not take DOM snapshot "Snapshot 1"\n',
    '[percy] Error: failure\n'
  ]);
});
