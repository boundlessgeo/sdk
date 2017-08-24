# Starting a React App With SDK

This guide walks through the steps necessary to create a new React-Redux
project that will feature maps through SDK.


## Install yarn

Yarn is yet another node package manager. However, it offers a number
of performance features over 
```bash
npm install -g yarn
```

## Install the React dependencies

```
yarn add -g create-react-app
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

This is a modification of the recommendations by the create-react-app authours,
it be reviewed in more depth [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-a-css-preprocessor-sass-less-etc).


After `"scripts": {`:

```json
   "build-css": "node-sass-chokidar src/ --include-path node_modules/ -o src/",
   "watch-css": "npm run build-css && node-sass-chokidar src/ --include-path node_modules/ -o src/ --watch --recursive",
```

`App.css` needs renamed to the sass extension `App.scss`:

```bash
mv src/App.css src/App.scss
```

## Add SDK Via git

As there has not yet been an official 2.X npm package release for SDK
this will install SDK and build it using Git.

```bash
yarn add https://github.com/boundlessgeo/sdk
cd node_modules/@boundlessgeo/sdk
npm install
npm run build:js
cd ../..
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

import SdkMap from '@boundlessgeo/sdk/lib/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/lib/reducers/map';
import * as SdkMapActions from '@boundlessgeo/sdk/lib/actions/map';
```

### Create a new store with the map reducer.

After the imports add a new reducer:
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

### Add the map component to the applcation

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
