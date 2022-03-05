/**
 * Quick work around script to remove the unused files that
 * are put into the dist directory. Because the site is
 * being built into a single file (index.html) these files
 * can all be discarded to save space as they are unused
 */
const {join} = require('path') // Use path join for resolving paths
const {rm} = require('fs/promises') // Use "rm" from the node file system promises api

// The output assets directory (The directory we want to remove)
const assetsDir = join(__dirname, '..', 'backend', 'public', 'assets')

// Recursively remove the assets directory
rm(assetsDir, {recursive: true, force: true})
    .then() // Then and catch results are ignored
    .catch() // build doesn't rely on their completion