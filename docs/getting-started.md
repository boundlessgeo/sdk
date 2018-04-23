## Getting started with SDK

This guide walks through the steps necessary to create a new React-Redux
project that will feature maps through SDK.

### Please use nvm

The [Node Version Manager](https://github.com/creationix/nvm)
provides a clean and easy way to keep
different versions of NodeJS installed simultaneously.

### Install yarn

Yarn is yet another node package manager. However, it offers a number
of performance features over npm.

```bash
npm install -g yarn
```

### Install the React dependencies

`create-react-app` installs itself as a global dependency.

```
npm install -g create-react-app
```

### Initialize the new app

```
create-react-app ./sdk-starter
cd sdk-starter
```

### Add the app dependencies

SDK-based apps do require additional dependencies. These include Redux for
managing state and node-sass for preprocessing CSS.

```
yarn add node-sass-chokidar redux react-redux ol ol-mapbox-style
```

### Add sass-building scripts to package.json

This is a modification of the recommendations by the create-react-app authors,
it can be reviewed in more depth [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-a-css-preprocessor-sass-less-etc).


After `"scripts": {`:

```json
   "build-css": "node-sass-chokidar src/ --include-path node_modules/ -o src/",
   "watch-css": "npm run build-css && node-sass-chokidar src/ --include-path node_modules/ -o src/ --watch --recursive",
```

`App.css` needs to be renamed with the sass extension `App.scss`:

```bash
mv src/App.css src/App.scss
```

### Installing SDK

Only *one* of the following techniques are needed for installing
the SDK.

#### From npm

This is the standard way of installing SDK.
It is appropriate for those looking to develop a quick SDK app
and do not need the latest features from the master branch.

It will install the dist-version of the library.

```bash
yarn add @boundlessgeo/sdk
```

#### From GitHub

This is the way to install SDK if the latest features are needed
or development on SDK is planned.

The following steps will clone SDK, install its dependencies,
build the library, and finally add it to the app.

```bash
cd ..
git clone https://github.com/boundlessgeo/sdk
cd sdk
npm install
npm run build:dist
cd ../sdk-starter
yarn add file:../sdk/dist
```

## Add a basic map:

### Add SDK Sass to the project

In your favorite editor open `src/App.scss`. On the first line add:

```css
@import "@boundlessgeo/sdk/stylesheet/sdk.scss";
```

Build the CSS files:

```bash
yarn run build-css
```

### Import SDK and Redux

Open `src/App.js` in your favorite editor. After the line `import './App.css';`,
add the following imports:


```javascript
import { createStore, combineReducers } from 'redux';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as SdkMapActions from '@boundlessgeo/sdk/actions/map';
```

### Create a new store with the map reducer.

After the imports add a store with the `SdkMapReducer`:
```javascript
const store = createStore(combineReducers({
  'map': SdkMapReducer,
}));
```
### Configuring the initial map

The map configuration needs to happen outside of the `render()` method.
`render()` will be called every time a prop or state element is changed
and this would cause map layers to be added repeatedly causing ill effects.
However, `componentDidMount` is only called once, after the component has been
mounted.

After `class App extends Component {`, add the following lines:

```javascript
componentDidMount() {
  // add the OSM source
  store.dispatch(SdkMapActions.addSource('osm', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
    type: 'raster',
    tileSize: 256,
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
  }));

  // add an OSM layer
  store.dispatch(SdkMapActions.addLayer({
    id: 'osm',
    source: 'osm',
  }));
}
```

### Add the map component to the application

After the last `</p>` tag add the following to add an SDK map:

```javascript
<SdkMap store={store} />
```

### Fire up the browser

The create-react-app creates a built-in hot-compiler and server.
```
yarn start
```

## Fin!

Congratulations! You should have a fully operational Boundless SDK React app!

### Unit testing
If you want to write unit tests in your application that use the SDK, make sure you have ```canvas``` installed as a ```devDependency```.
See [here](https://github.com/boundlessgeo/sdk/blob/master/DEVELOPING.md#testing-and-the-canvas-module) for more details.

### Doing a production build
In the current state, `yarn build``` will fail with something like:

    ```bash
    yarn build v1.0.1
    $ react-scripts build
    Creating an optimized production build...
    Failed to compile.

    Failed to minify the code from this file:

         ./node_modules/@mapbox/mapbox-gl-style-spec/feature_filter/index.js:15

    Read more here: http://bit.ly/2tRViJ9

    error Command failed with exit code 1.
    ```

This is because some of the dependencies are not published to npm as ES5.
In order to fix this, we need to eject our application and make changes to `config/webpack/config.prod.js`. See the instructions in the next section.

### Ejecting Create React App

1. `yarn eject`
2. `yarn add webpack-cli`
3. Modify `config/webpack.config.prod.js`.

    This section defines which files Babel will transform (on or about line 149):
    ```javascript
      // Process JS with Babel.
      {
        test: /\.(js|jsx)$/,
        include: paths.appSrc,
        loader: require.resolve('babel-loader'),
        options: {

          compact: true,
        },
      },
    ```

    The include path must be changed from: 
    ```
    include: paths.appSrc,
    ```
    To:
    ```
    include: [paths.appSrc, path.resolve(__dirname, '../node_modules/')],
    ```
4. Modify `config/webpack.config.dev.js`, to disable hot-reloading.
   Hot reloading will not work inside of webpack-dev-server and will simply
   throw additional errors when served from a static webserver.

   Change this line (on or about line 46):

   ```
    require.resolve('react-dev-utils/webpackHotDevClient'),
   ```

   To:
   ```
    // require.resolve('react-dev-utils/webpackHotDevClient'),

   ```

5. Modify `package.json` by adding the following line after `"scripts": {`:
    ```
    "watch": "NODE_ENV=development webpack --watch --config ./config/webpack.config.dev.js",
    ```
6. Serving content.

    After the watch task has been setup the `build/` directory will need to be
    served using a HTTP server. The create-react-app documentation recommends using
    `serve` but this can be problematic as `serve` does not support proxying.

    As an alternative, [http-server](https://github.com/indexzero/http-server) does support
    proxying and is also a light weight install.
