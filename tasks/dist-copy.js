/** Copies the files necessary to create the dist-form of SDK
 *
 */

const fs = require('fs');
const fsx = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

// HEADER for the README.md file.
const README_HEADER = `
# Boundless SDK
![Logo](http://boundlessgeo.github.io/sdk/book/styles/boundless_sdk_horiz.svg)

[![Travis CI Status](https://secure.travis-ci.org/boundlessgeo/sdk.svg)](http://travis-ci.org/#!/boundlessgeo/sdk)
[![Coverage Status](https://coveralls.io/repos/github/boundlessgeo/sdk/badge.svg?branch=master)](https://coveralls.io/github/boundlessgeo/sdk?branch=master)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Javascript SDK based on React, OpenLayers and Redux.

`;

// pull in the getting-started doc
const QUICKSTART = fs.readFileSync(path.join(srcDir, '..', 'docs', 'getting-started.md'));

function main() {
  const copy_files = ['LICENSE.md'];

  for(const filename of copy_files) {
    fsx.copy(path.join(srcDir, '..', filename), path.join(distDir, filename));
  }

  fsx.copy(path.join(srcDir, 'stylesheet'), path.join(distDir, 'stylesheet'));

  // build the new README
  // this is more appropriate for an NPM readme...
  fs.writeFile(path.join(distDir, 'README.md'), README_HEADER + QUICKSTART, function(err) {
    if(err) {
      // eslint-disable-next-line no-console
      return console.log(err);
    }
    // eslint-disable-next-line no-console
    console.log("README.md written correctly.");
  });
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
