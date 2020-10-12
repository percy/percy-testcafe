import fs from 'fs';
import fetch from 'node-fetch';
import log from '@percy/logger';
import { t } from 'testcafe';

// Collect client and environment information
import sdkPkg from './package.json';
import testCafePkg from 'testcafe/package.json';
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const ENV_INFO = `${testCafePkg.name}/${testCafePkg.version}`;

// Maybe get the CLI API address from the environment
const { PERCY_CLI_API = 'http://localhost:5338/percy' } = process.env;

// Check if Percy is enabled using the healthcheck endpoint
async function isPercyEnabled() {
  if (isPercyEnabled.result == null) {
    try {
      let response = await fetch(`${PERCY_CLI_API}/healthcheck`);
      isPercyEnabled.result = response.ok;
    } catch (err) {
      isPercyEnabled.result = false;
      log.debug(err);
    }

    if (isPercyEnabled.result === false) {
      log.info('Percy is not running, disabling snapshots');
    }
  }

  return isPercyEnabled.result;
};

async function percySnapshot(name, options) {
  if (!name) throw new Error('The `name` argument is required.');
  if (!(await isPercyEnabled())) return;

  try {
    // Inject the DOM serialization script
    /* eslint-disable-next-line no-new-func */
    await t.eval(new Function(fs.readFileSync(require.resolve('@percy/dom'), 'utf-8')));

    // Serialize and capture the DOM
    /* istanbul ignore next: no instrumenting injected code */
    let domSnapshot = await t.eval(() => {
      /* eslint-disable-next-line no-undef */
      return PercyDOM.serialize(options);
    }, { dependencies: { options } });

    /* istanbul ignore next: no instrumenting injected code */
    let documentURL = await t.eval(() => document.URL);

    // Post the DOM to the snapshot endpoint with snapshot options and other info
    let response = await fetch(`${PERCY_CLI_API}/snapshot`, {
      method: 'POST',
      body: JSON.stringify({
        ...options,
        environmentInfo: ENV_INFO,
        clientInfo: CLIENT_INFO,
        url: documentURL,
        domSnapshot,
        name
      })
    });

    // Handle errors
    let { success, error } = await response.json();
    if (!success) throw new Error(error);
  } catch (err) {
    log.error(`Could not take DOM snapshot "${name}"`);
    log.error(err);
  }
}

module.exports = percySnapshot;
module.exports.isPercyEnabled = isPercyEnabled;
