/** Realtime data example.
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkZoomControl from '@boundlessgeo/sdk/components/map/zoom-control';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import SdkMapboxReducer from '@boundlessgeo/sdk/reducers/mapbox';
import * as mapActions from '@boundlessgeo/sdk/actions/map';
import * as mapboxActions from '@boundlessgeo/sdk/actions/mapbox';

import CONFIG from './conf'; // eslint-disable-line

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
  mapbox: SdkMapboxReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/bright-v8';
  store.dispatch(mapboxActions.configure({baseUrl, accessToken: CONFIG.access_token}));

  // Start with a reasonable global view of the map.
  store.dispatch(mapActions.setView([-93, 45], 2));

  // set the sprite so we can use icon-image
  store.dispatch(mapActions.setSprite('mapbox://sprites/mapbox/bright-v8'));

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
  store.dispatch(mapActions.addLayer({
    id: 'osm',
    source: 'osm',
  }));

  const url = 'https://wanderdrone.appspot.com/';

  // add our drone source
  store.dispatch(mapActions.addSource('drone', { type: 'geojson', data: url }));

  // add our drone layer with an icon-image from the sprite
  store.dispatch(mapActions.addLayer({
    id: "drone",
    type: "symbol",
    source: "drone",
    layout: {
      "icon-image": "rocket-15"
    }
  }));

  // update the data every 2 seconds
  window.setInterval(function() {
    store.dispatch(mapActions.updateSource('drone', {data: url}));
  }, 2000);

  // place the map on the page.
  ReactDOM.render(<Provider store={store}>
    <SdkMap>
      <SdkZoomControl />
    </SdkMap>
  </Provider>, document.getElementById('map'));
}

main();
