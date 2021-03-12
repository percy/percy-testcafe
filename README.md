# @percy/testcafe
[![Version](https://img.shields.io/npm/v/@percy/testcafe.svg)](https://www.npmjs.com/package/@percy/testcafe)
![Test](https://github.com/percy/percy-testcafe/workflows/Test/badge.svg)

[Percy](https://percy.io) visual testing for
[TestCafe](https://www.devexpress.com/products/testcafestudio/).

## Installation

Using yarn:

```sh-session
$ yarn add --dev @percy/cli @percy/testcafe@next
```

Using npm:

```sh-session
$ npm install --save-dev @percy/cli @percy/testcafe@next
```

## Usage

This is an example test using the `percySnapshot` function.

```javascript
import percySnapshot from '@percy/testcafe';

fixture('MyFixture')
  .page('http://devexpress.github.io/testcafe/example');

test('Test1', async t => {
  await t.typeText('#developer-name', 'John Doe');
  await percySnapshot(t, 'TestCafe Example');
});
```

Running the test above normally will result in the following log:

```sh-session
[percy] Percy is not running, disabling snapshots
```

When running with [`percy
exec`](https://github.com/percy/cli/tree/master/packages/cli-exec#percy-exec), and your project's
`PERCY_TOKEN`, a new Percy build will be created and snapshots will be uploaded to your project.

```sh-session
$ export PERCY_TOKEN=[your-project-token]
$ percy exec -- testcafe chrome:headless tests
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Running "testcafe chrome:headless tests"

 Running tests in:
 - Chrome ...

 MyFixture
[percy] Snapshot taken "TestCafe Example"
 ✓ Test1

 1 passed (1s)

[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!
```

## Configuration

`percySnapshot(t, name[, options])`

- `t`(**required**) - The test controller instance passed from `test`
- `name` (**required**) - The snapshot name; must be unique to each snapshot
- `options` - Additional snapshot options (overrides any project options)
  - `options.widths` - An array of widths to take screenshots at
  - `options.minHeight` - The minimum viewport height to take screenshots at
  - `options.percyCSS` - Percy specific CSS only applied in Percy's rendering environment
  - `options.requestHeaders` - Headers that should be used during asset discovery
  - `options.enableJavaScript` - Enable JavaScript in Percy's rendering environment

## Upgrading

### Migrating Config

If you have a previous Percy configuration file, migrate it to the newest version with the
[`config:migrate`](https://github.com/percy/cli/tree/master/packages/cli-config#percy-configmigrate-filepath-output) command:

```sh-session
$ percy config:migrate
```
