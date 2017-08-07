# Boundless SDK

## Testing and the canvas module

The test suite uses the NPM `canvas` module to test certain interactions
with OpenLayers.  This requires `node-gyp` and the following dependencies:

**Debian/Ubuntu**

```bash
sudo apt-get install -y libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev g++
```

It is possible to run the tests without the `canvas` module. In this case a number
of tests will be skipped.
