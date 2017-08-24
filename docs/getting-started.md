# Getting started with SDK

This guide walks through the steps necessary to create a new React-Redux
project that will feature maps through SDK.

## Please use nvm

The [Node Version Manager](https://github.com/creationix/nvm)
provides a clean and easy way to keep
different versions of NodeJS installed simultaneously.

## Install yarn

Yarn is yet another node package manager. However, it offers a number
of performance features over npm.

```bash
npm install -g yarn
```

## Install the React dependencies

`create-react-app` installs itself as a global dependency.

```
npm install -g create-react-app
```

## Initialize the new app

```
create-react-app ./sdk-starter
cd sdk-starter
```

### Add the app dependencies

SDK-based apps do require additional dependencies. These include Redux for
managing state and node-sass for preprocessing CSS.

```
yarn add node-sass-chokidar redux
```

### Add sass-building scripts to package.json

This is a modification of the recommendations by the create-react-app authors,
it be reviewed in more depth [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-a-css-preprocessor-sass-less-etc).


After `"scripts": {`:

```json
   "build-css": "node-sass-chokidar src/ --include-path node_modules/ -o src/",
   "watch-css": "npm run build-css && node-sass-chokidar src/ --include-path node_modules/ -o src/ --watch --recursive",
```

`App.css` needs to be renamed with the sass extension `App.scss`:

```bash
mv src/App.css src/App.scss
```

## Installing SDK

Only *one* of the following techniques are needed for installing 
the SDK. 

### From npm

This is the standard way of installing SDK.
It is appropriate for those looking to develop a quick SDK app
and do not need the latest features from the master branch.

It will install the dist-version of the library.

```bash
yarn add @boundlessgeo/sdk
```

### From GitHub

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

## Add a basic map.

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

## Fin

Congratulations! You should have a fully operational SDK React app!
