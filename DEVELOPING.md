# Boundless SDK

## Using SDK from Source

Using SDK from source requires running `npm run dist` to create a `dist/` subdirectory
which produces the structure used for the npm package.

```
# Clone the repository
git clone https://github.com/boundlessgeo/sdk.git
# Enter the repo
cd sdk
# install dependencies
npm install
# create the package
npm run dist
# enter the package directory
cd dist/
# link to SDK
npm link
```

## Testing and the canvas module

The test suite uses the NPM `canvas` module to test certain interactions
with OpenLayers.  This requires `node-gyp` and the following dependencies:

**Debian/Ubuntu**

```bash
sudo apt-get install -y libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev g++
```

It is possible to run the tests without the `canvas` module. In this case a number
of tests will be skipped.
