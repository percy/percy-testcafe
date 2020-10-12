import expect from 'expect';
import stdio from '@percy/logger/test/helper';
import createTestServer from '@percy/core/test/helpers/server';
import percySnapshot from '..';

let testServer, percyServer;

// test site
createTestServer({
  default: () => [200, 'text/html', 'Snapshot Me']
}).then(s => {
  testServer = s;
});

fixture('percySnapshot')
  .page('http://localhost:8000')
  .beforeEach(async () => {
    // clear previous healthcheck result
    delete percySnapshot.isPercyEnabled.result;

    // mock percy server
    percyServer = await createTestServer({
      default: () => [200, 'application/json', { success: true }]
    }, 5338);
  })
  .afterEach(async () => {
    await percyServer.close();
  })
  .after(async () => {
    await testServer.close();
  });

test('throws an error when a name is not provided', async () => {
  await expect(percySnapshot())
    .rejects.toThrow('The `name` argument is required.');
});

test('disables snapshots when the healthcheck fails', async () => {
  percyServer.reply('/percy/healthcheck', () => Promise.reject(new Error()));

  await stdio.capture(async () => {
    await percySnapshot('Snapshot 1');
    await percySnapshot('Snapshot 2');
  });

  expect(percyServer.requests).toEqual([
    ['/percy/healthcheck']
  ]);

  expect(stdio[2]).toHaveLength(0);
  expect(stdio[1]).toEqual([
    '[percy] Percy is not running, disabling snapshots\n'
  ]);
});

test('disables snapshots when the healthcheck encounters an error', async () => {
  percyServer.reply('/percy/healthcheck', req => req.connection.destroy());

  await stdio.capture(async () => {
    await percySnapshot('Snapshot 1');
    await percySnapshot('Snapshot 2');
  });

  expect(percyServer.requests).toEqual([
    ['/percy/healthcheck']
  ]);

  expect(stdio[2]).toHaveLength(0);
  expect(stdio[1]).toEqual([
    '[percy] Percy is not running, disabling snapshots\n'
  ]);
});

test('posts snapshots to the local percy server', async () => {
  await percySnapshot('Snapshot 1');
  await percySnapshot('Snapshot 2');

  expect(percyServer.requests).toEqual([
    ['/percy/healthcheck'],
    ['/percy/snapshot', {
      name: 'Snapshot 1',
      url: 'http://localhost:8000/',
      domSnapshot: '<!DOCTYPE html><html><head></head><body>Snapshot Me</body></html>',
      clientInfo: expect.stringMatching(/@percy\/testcafe\/.+/),
      environmentInfo: expect.stringMatching(/testcafe\/.+/)
    }],
    ['/percy/snapshot', expect.objectContaining({
      name: 'Snapshot 2'
    })]
  ]);
});

test('handles snapshot errors', async () => {
  percyServer.reply('/percy/snapshot', () => (
    [400, 'application/json', { success: false, error: 'testing' }]
  ));

  await stdio.capture(async () => {
    await percySnapshot('Snapshot 1');
  });

  expect(stdio[1]).toHaveLength(0);
  expect(stdio[2]).toEqual([
    '[percy] Could not take DOM snapshot "Snapshot 1"\n',
    '[percy] Error: testing\n'
  ]);
});
