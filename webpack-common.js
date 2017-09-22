const { lstatSync, readdirSync } = require('fs')
const path = require('path');
const { join } = require('path');
const conf = require('./tasks/config');

const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory)

module.exports = {
  getEntries(dev) {
    const subDirs = getDirectories('./examples');
    const entry = {};
    for (let i = 0, ii = subDirs.length; i < ii; ++i) {
      const name = subDirs[i].split(path.sep).pop();
      if (name !== 'resources' && (dev || conf.skip.indexOf(name) === -1)) {
        entry[name] = dev ? [
          'webpack/hot/only-dev-server'
        ] : [];
        entry[name].push(`.${path.sep}${subDirs[i]}${path.sep}app.js`);
      }
    }
    return entry;
  }
};
