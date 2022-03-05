/**
 * Quick work around script to remove the SVG files that
 * were copied to the output directory when they did not
 * need to be. (Increases file size when it doesn't need to)
 */
const path = require('path')
const fsPromise = require('fs/promises')

async function removeAssets() {
    const assetsDir = path.join(__dirname, '../', 'backend', 'public', 'assets')
    await fsPromise.rm(assetsDir, {recursive: true, force: true})
}

removeAssets().then()