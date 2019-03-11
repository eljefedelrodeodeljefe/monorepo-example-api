const readPkg = require('read-pkg')
const { compose } = require('ramda')
const pluginDefinitions = require('semantic-release/lib/definitions/plugins')
const { wrapPlugin, wrapMultiPlugin } = require('./lib/decorate')

const { mapNextReleaseVersion, withOptionsTransforms } = require('./lib/options-transforms')
const withOnlyPackageCommits = require('./lib/only-package-commits')
const versionToGitTag = require('./lib/version-to-git-tag')
const logPluginVersion = require('./lib/log-plugin-version')

const NAMESPACE = 'monorepo'

const analyzeCommits = wrapPlugin(
  NAMESPACE,
  'analyzeCommits',
  compose(logPluginVersion('analyzeCommits'), withOnlyPackageCommits),
  pluginDefinitions.analyzeCommits.default
)

const generateNotes = wrapMultiPlugin(
  NAMESPACE,
  'generateNotes',
  compose(
    logPluginVersion('generateNotes'),
    withOnlyPackageCommits,
    withOptionsTransforms([mapNextReleaseVersion(versionToGitTag)])
  ),
  pluginDefinitions.generateNotes.default
)

module.exports = {
  analyzeCommits,
  generateNotes,
  tagFormat: readPkg.sync().name + '-v${version}' // eslint-disable-line no-template-curly-in-string
}
