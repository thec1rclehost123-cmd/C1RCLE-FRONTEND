const path = require('node:path');

const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm-monorepo Metro recipe: watch the whole workspace and resolve
// hoisted @c1rcle/* packages from the workspace root's node_modules, not
// just this app's own (pnpm's strict symlink layout otherwise hides them).
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
