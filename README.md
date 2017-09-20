# Boundless SDK
![Logo](http://boundlessgeo.github.io/sdk/book/styles/boundless_sdk_horiz.svg)

[![Travis CI Status](https://secure.travis-ci.org/boundlessgeo/sdk.svg)](http://travis-ci.org/#!/boundlessgeo/sdk)
[![Coverage Status](https://coveralls.io/repos/github/boundlessgeo/sdk/badge.svg?branch=master)](https://coveralls.io/github/boundlessgeo/sdk?branch=master)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Javascript SDK based on React, OpenLayers and Redux.

For the previous version, please see the 1.x branch instead.

## Running Project
To run the examples,

First, clone the project: `git clone https://github.com/boundlessgeo/sdk.git`

Then change into directory of cloned project: `cd sdk`

and run the following commands:

`npm install` - install libraries

`npm run build:examples` - build examples from templates

`npm start` - start webpack-dev-server

The last command should open your browser to a page of examples: http://localhost:3000/build/examples

## Using the SDK source to develop a local project

Please read [DEVELOPING.md](DEVELOPING.md) on how to create the SDK package and link to it locally.

## Troubleshooting

If `npm start` fails review node version, SDK targets v6.0 or greater.  On OSX node install can be error prone, seems to work best when installed by Brew http://brewformulas.org/Node

## Running tests

The test suite will skip a number of tests unless the `canvas` module has been installed.

For more details on installing `canvas` and other important developer notes
please read [DEVELOPING.md](DEVELOPING.md).
