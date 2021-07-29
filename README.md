# @percy/testcafe
[![Version](https://img.shields.io/npm/v/@percy/testcafe.svg)](https://www.npmjs.com/package/@percy/testcafe)
![Test](https://github.com/percy/percy-testcafe/workflows/Test/badge.svg)

[Percy](https://percy.io) visual testing for
[TestCafe](https://www.devexpress.com/products/testcafestudio/).

## Installation

```sh-session
$ npm install --save-dev @percy/cli @percy/testcafe
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
- `options` - [See per-snapshot configuration options](https://docs.percy.io/docs/cli-configuration#per-snapshot-configuration)

## Upgrading

### Automatically with `@percy/migrate`

We built a tool to help automate migrating to the new CLI toolchain! Migrating
can be done by running the following commands and following the prompts:

``` shell
$ npx @percy/migrate
? Are you currently using @percy/testcafe? Yes
? Install @percy/cli (required to run percy)? Yes
? Migrate Percy config file? Yes
? Upgrade SDK to @percy/testcafe@1.0.0? Yes
```

This will automatically run the changes described below for you.

### Manually

#### Installing `@percy/cli`

If you're coming from a pre-2.0 version of this package, make sure to install `@percy/cli` after
upgrading to retain any existing scripts that reference the Percy CLI command.

```sh-session
$ npm install --save-dev @percy/cli
```

#### Migrating Config

If you have a previous Percy configuration file, migrate it to the newest version with the
[`config:migrate`](https://github.com/percy/cli/tree/master/packages/cli-config#percy-configmigrate-filepath-output) command:

```sh-session
$ percy config:migrate
```
