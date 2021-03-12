const utils = require('@percy/sdk-utils');

// Collect client and environment information
const sdkPkg = require('./package.json');
const testCafePkg = require('testcafe/package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const ENV_INFO = `${testCafePkg.name}/${testCafePkg.version}`;

// Take a DOM snapshot and post it to the snapshot endpoint
module.exports = async function percySnapshot(t, name, options) {
  if (!t) throw new Error("The test function's `t` argument is required.");
  if (!name) throw new Error('The `name` argument is required.');
  if (!(await utils.isPercyEnabled())) return;
  let log = utils.logger('testcafe');

  try {
    // Inject the DOM serialization script
    /* eslint-disable-next-line no-new-func */
    await t.eval(new Function(await utils.fetchPercyDOM()), { boundTestRun: t });

    // Serialize and capture the DOM
    /* istanbul ignore next: no instrumenting injected code */
    let { domSnapshot, url } = await t.eval(() => ({
      /* eslint-disable-next-line no-undef */
      domSnapshot: PercyDOM.serialize(options),
      url: document.URL
    }), { boundTestRun: t, dependencies: { options } });

    // Post the DOM to the snapshot endpoint with snapshot options and other info
    await utils.postSnapshot({
      ...options,
      environmentInfo: ENV_INFO,
      clientInfo: CLIENT_INFO,
      domSnapshot,
      url,
      name
    });
  } catch (error) {
    // Handle errors
    log.error(`Could not take DOM snapshot "${name}"`);
    log.error(error);
  }
};
