const utils = require('@percy/sdk-utils');

// Collect client and environment information
const sdkPkg = require('./package.json');
const testCafePkg = require('testcafe/package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const ENV_INFO = `${testCafePkg.name}/${testCafePkg.version}`;

function parseProxyBaseUrl(proxyUrl) {
  // proxyUrl is of format http://192.168.0.104:57634/VsZiT1t2l*stFMYCMD1/https://www.example.com/
  const parsedProxyUrl = new URL(proxyUrl);
  return `${parsedProxyUrl.origin}/${parsedProxyUrl.pathname.split('/')[1]}`;
}

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
    let { domSnapshot, url, proxyUrl } = await t.eval(() => ({
      /* eslint-disable-next-line no-undef */
      domSnapshot: PercyDOM.serialize(options),
      // window.location.href as well as document.URL is overriden to return correct test page url
      // and does not include proxy url
      url: window.location.href || document.URL,
      // We get proxy URL from internal implementation of hammerhead, there is no API to get it
      // otherwise in testcafe. We need this because when https sites are being tested with http
      // proxy, we are unable to do resource discovery due to SSL errors [ testcafe replaces
      // all urls with proxied urls and causes http calls from https page in asset discovery ]
      proxyUrl: window['%hammerhead%']?.utils?.url?.getProxyUrl('')
    }), { boundTestRun: t, dependencies: { options } });

    if (proxyUrl) {
      url = `${parseProxyBaseUrl(proxyUrl)}/${url}`;
    }

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
