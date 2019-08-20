const { readFileSync } = require("fs");
const { ClientFunction } = require("testcafe");
const {
  postSnapshot,
  agentJsFilename
} = require("@percy/agent/dist/utils/sdk-utils");

const sdkPkg = require("./package.json");
const testCafePkg = require("testcafe/package.json");

let isPercyRunning = true;

async function percySnapshot(test, snapshotName, snapshotOptions) {
  if (!isPercyRunning) {
    return;
  }

  let getURL = ClientFunction(() => window.location.href).with({
    boundTestRun: test
  });
  // Inject the JS that captures and serializes the DOM
  let agentFileContents = readFileSync(agentJsFilename()).toString();
  // TODO, capture the case where the script doesn't inject and add a nice error
  let loadScriptFile = ClientFunction(
    () => {
      var script = document.createElement("script");

      script.text = agentFileContents;
      document.body.append(script);

      return true;
    },
    { dependencies: { agentFileContents: agentFileContents } }
  ).with({ boundTestRun: test });

  let getDOMSnapshot = ClientFunction(
    () => {
      let percyAgentClient = new PercyAgent({
        handleAgentCommunication: false
      });

      return percyAgentClient.snapshot(snapshotName, snapshotOptions);
    },
    {
      dependencies: {
        snapshotName: snapshotName,
        snapshotOptions: snapshotOptions
      }
    }
  ).with({ boundTestRun: test });

  await loadScriptFile();
  let url = await getURL();
  // Get the serialized DOM from the browser
  let domSnapshot = await getDOMSnapshot();
  // Send it off to `@percy/agent` for asset discovery
  await postDomSnapshot(snapshotName, domSnapshot, url, snapshotOptions);
}

async function postDomSnapshot(name, domSnapshot, url, options) {
  let postSuccess = await postSnapshot({
    url,
    name,
    domSnapshot,
    clientInfo: clientInfo(),
    environmentInfo: environmentInfo(),
    ...options
  });

  if (!postSuccess) {
    console.log(`[percy] Error posting snapshot to agent, disabling Percy`);
    isPercyRunning = false;
  }
}

function clientInfo() {
  return `@percy/testcafe-${sdkPkg.version}`;
}

function environmentInfo() {
  return `testcafe-${testCafePkg.version}`;
}

module.exports = percySnapshot;
