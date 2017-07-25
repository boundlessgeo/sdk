/** Show some sprites on the map
 *
 *  Duck, duck, GOOSE!
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.css';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  // Start with a reasonable global view of the map.
  store.dispatch(mapActions.setView([0, 0], 3));

  // setup the map sprites.
  store.dispatch(mapActions.setSprites('./sprites'));

  // add the OSM source
  store.dispatch(mapActions.addSource('osm', {
    type: 'raster',
    tileSize: 256,
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
  }));

  // and an OSM layer.
  // Raster layers need not have any paint styles.
  store.dispatch(mapActions.addLayer({
    id: 'osm',
    source: 'osm',
  }));

  // 'geojson' sources allow rendering a vector layer
  // with all the features stored as GeoJSON. "data" can
  // be an individual Feature or a FeatureCollection.
  store.dispatch(mapActions.addSource('points', {
    type: 'geojson',
    data: {},
  }));

  // Define a layer to render the features from
  // the points source as icons.
  store.dispatch(mapActions.addLayer({
    id: 'symbols',
    source: 'points',
    type: 'symbol',
    layout: {
      'icon-image': '{icon}',
    },
  }));

  // Add a Point with an Icon to the points source.
  const addSymbol = (x, y, icon) => {
    store.dispatch(mapActions.addFeatures('points', [{
      type: 'Feature',
      properties: {
        // ensure the icon property is set.
        icon,
      },
      geometry: {
        type: 'Point',
        coordinates: [x, y],
      },
    }]));
  };

  // These are syntactically correct but philosophically wrong,
  //  as the game is technically "Duck, Duck, Grey Duck"
  addSymbol(-45, 0, 'duck');
  addSymbol(0, 0, 'duck');
  addSymbol(45, 0, 'goose');

  // place the map on the page.
  ReactDOM.render(<SdkMap store={store} />, document.getElementById('map'));
}

main();
