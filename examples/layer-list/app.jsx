/** Demo of layer list in an SDK map.
 *
 *  Contains a Map and demonstrates adding many types of layers
<<<<<<< 81076615dcd38e1deda120055a39fa958a76c315
 *  And a layer list component to manage the layers
=======
 *  And a layer list componet to manage the layers
>>>>>>> Adding in files
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

import LayerList from './components/layerList';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  // Start with a reasonable global view of hte map.
  store.dispatch(mapActions.setView([-93, 45], 2));

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
  store.dispatch(mapActions.addSource('dynamic-source', { type: 'geojson' }));

  store.dispatch(mapActions.addLayer({
    id: 'dynamic-layer',
    type: 'circle',
    source: 'dynamic-source',
    paint: {
      'circle-radius': 5,
      'circle-color': '#552211',
      'circle-stroke-color': '#00ff11',
    },
  }));
  // Fetch the geoJson file from a url and add it to the map at the named source
  const addLayerFromGeoJSON = (url, sourceName) => {
    // Fetch URL
    fetch(url)
      .then(
        response => response.json(),
        error => console.error('An error occured.', error),
      )
      // addFeatures with the features, source name, and crs
<<<<<<< 8a7e367b939c6b1e27a979da5076c6e739e2cb76
<<<<<<< 81076615dcd38e1deda120055a39fa958a76c315
      .then(json => store.dispatch(mapActions.addFeatures(sourceName, json)));
=======
      .then(json => store.dispatch(mapActions.addFeatures(sourceName, json.features, json.crs)));
>>>>>>> Adding in files
=======
      .then(json => store.dispatch(mapActions.addFeatures(sourceName, json)));
>>>>>>> Linting
  };

  // This is called by the onClick, keeping the onClick HTML clean
  const runFetchGeoJSON = () => {
<<<<<<< 81076615dcd38e1deda120055a39fa958a76c315
    // const url = './data/airports.json';
    // addLayerFromGeoJSON(url, 'dynamic-source');
    store.dispatch(mapActions.addSource('dynamic-source',
      { type: 'geojson', data: './data/airports.json' }));
=======
    const url = './data/airports.json';
    addLayerFromGeoJSON(url, 'dynamic-source');
>>>>>>> Adding in files
  };
  runFetchGeoJSON();
  // 'geojson' sources allow rendering a vector layer
  // with all the features stored as GeoJSON. "data" can
  // be an individual Feature or a FeatureCollection.
  store.dispatch(mapActions.addSource('points', {
    type: 'geojson',
    clusterRadius: 50,
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  }));

  // Show the unclustered points in a different colour.
  store.dispatch(mapActions.addLayer({
    id: 'random-points',
    source: 'points',
    type: 'circle',
    paint: {
      'circle-radius': 3,
      'circle-color': '#756bb1',
      'circle-stroke-color': '#756bb1',
    },
    filter: ['!has', 'point_count'],
  }));

  // Add a random point to the map
  const addRandomPoints = (nPoints = 10) => {
    // loop over adding a point to the map.
    for (let i = 0; i < nPoints; i++) {
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

  // add 200 random points to the map on startup
  addRandomPoints(200);

  // add the wms source
  store.dispatch(mapActions.addSource('states', {
    type: 'raster',
    tileSize: 256,
    tiles: ['https://ahocevar.com/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],
  }));

  // add the wms layer
  store.dispatch(mapActions.addLayer({
    id: 'states',
    source: 'states',
  }));

  // place the map on the page.
  ReactDOM.render(<SdkMap store={store} />, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <LayerList store={store} />
    </div>
  ), document.getElementById('controls'));
}

main();
