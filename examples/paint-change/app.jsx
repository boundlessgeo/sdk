/** Demonstrate changing the color of points at run time.
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
  store.dispatch(mapActions.setView([-1759914.3204498321, 3236495.368492126], 2));

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

  // Background layers change the background color of
  // the map. They are not attached to a source.
  store.dispatch(mapActions.addLayer({
    id: 'background',
    type: 'background',
    paint: {
      'background-color': '#eee',
    },
  }));

  // The points source has both null island
  // and random points on it. This layer
  // will style all random points as purple instead
  // of orange.
  store.dispatch(mapActions.addLayer({
    id: 'random-points',
    type: 'circle',
    source: 'points',
    paint: {
      'circle-radius': 5,
      'circle-color': '#756bb1',
      'circle-stroke-color': '#756bb1',
    },
  }));

  // Add a random point to the map
  const addRandomPoints = (n_points = 100) => {
    // loop over adding a point to the map.
    for (let i = 0; i < n_points; i++) {
      // the feature is a normal GeoJSON feature definition,
      // 'points' referes to the SOURCE which will get the feature.
      store.dispatch(mapActions.addFeatures('points', [{
        type: 'Feature',
        properties: {
          title: 'Random Point',
          isRandom: true,
        },
        geometry: {
          type: 'Point',
          // this generates a point somewhere on the planet, unbounded.
          coordinates: [(Math.random() * 360) - 180, (Math.random() * 180) - 90],
        },
      }]));
    }
  };

  // Demonstrate the paint colors changing.
  const changeColor = (color) => {
    store.dispatch(mapActions.updateLayer('random-points', {
      paint: {
        'circle-radius': 5,
        'circle-color': color,
        'circle-stroke-color': color,
      },
    }));
  };

  addRandomPoints();

  // place the map on the page.
  ReactDOM.render(<SdkMap store={store} />, document.getElementById('map'));

  // Create a list of controls which can change the color of the
  //  random points on the map.
  const colors = ['#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'];
  const color_controls = [];

  for (let i = 0, ii = colors.length; i < ii; i++) {
    const color = colors[i];
    const control_style = {
      backgroundColor: color,
      display: 'inline-block',
      width: '1em',
      height: '1em',
      border: 'solid 1px black',
      cursor: 'pointer',
      marginLeft: '5px',
    };
    color_controls.push((
      <div
        role="button"
        tabIndex={0}
        key={i}
        className="colorChanger"
        style={control_style}
        onClick={() => { changeColor(color); }}
      />
    ));
  }

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <b>Choose a color for the points on the map:</b> <br />
      { color_controls }
    </div>
  ), document.getElementById('controls'));
}

main();
