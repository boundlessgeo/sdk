/** Copies the files necessary to create the dist-form of SDK
 *
 */

const fsx = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');


function main() {
  // copy the package.json
  fsx.copy(path.join(srcDir, '..', 'package.json'), path.join(distDir, 'package.json'));
  // get the stylesheet.
  fsx.copy(path.join(srcDir, 'stylesheet'), path.join(distDir, 'stylesheet'));
}

if (require.main === module) {
  main((err) => {
    if (err) {
      process.stderr.write(`Copying dist files failed. See the full trace below.\n\n ${err.stack} \n`);
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}

module.exports = main;
