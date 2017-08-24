/** Version of the basic application example but using EPSG:4326.
 *
 *  Contains a Map and demonstrates some of the dynamics of
 *  using the store.
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkHashHistory from '@boundlessgeo/sdk/components/history';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  // Start with a reasonable global view of the map.
  store.dispatch(mapActions.setView([-93, 45], 2));

  store.dispatch(mapActions.setMapName('Basic Map Example'));

  // Add an example from ArcGIS Online REST services.
  store.dispatch(mapActions.addSource('esri', {
    type: 'raster',
    crossOrigin: null,
    tiles: [
      // The {bbox-epsg-3857} is a misnomer in this case.
      // MapBox GL Style spec does not outline specifying {bbox-epsg-4326}
      // or {bbox} for native map coordiantes as it does not appear to consider
      // rendering maps in projections other than EPSG:3857.
      // 'https://server.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=&layers=&layerDefs=&size=&imageSR=&format=png&transparent=false&f=image'
      'https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/World/MODIS/ImageServer/exportImage?bbox={bbox-epsg-3857}&pixelType=U8&f=image',
    ],
  }));

  // This layer is what is presented from the 'esri' source.
  store.dispatch(mapActions.addLayer({
    id: 'esri',
    source: 'esri',
  }));

  // 'geojson' sources allow rendering a vector layer
  // with all the features stored as GeoJSON. "data" can
  // be an individual Feature or a FeatureCollection.
  store.dispatch(mapActions.addSource('points', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
      properties: {
        title: 'Null Island',
      },
    },
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

  // Show null island as a layer.
  store.dispatch(mapActions.addLayer({
    id: 'null-island',
    source: 'points',
    type: 'circle',
    paint: {
      'circle-radius': 3,
      'circle-color': '#feb24c',
      'circle-stroke-color': '#f03b20',
    },
    filter: ['!=', 'isRandom', true],
  }));

  // The points source has both null island
  // and random points on it. This layer
  // will style all random points as purple instead
  // of orange.
  store.dispatch(mapActions.addLayer({
    id: 'random-points',
    source: 'points',
    paint: {
      'circle-radius': 5,
      'circle-color': '#756bb1',
      'circle-stroke-color': '#756bb1',
    },
    filter: ['==', 'isRandom', true],
  }));

  // test the placement of an image on the map.
  store.dispatch(mapActions.addSource('overlay', {
    type: 'image',
    url: 'https://www.mapbox.com/mapbox-gl-js/assets/radar.gif',
    coordinates: [
      [-80.425, 46.437],
      [-71.516, 46.437],
      [-71.516, 37.936],
      [-80.425, 37.936],
    ],
  }));

  store.dispatch(mapActions.addLayer({
    id: 'overlay',
    source: 'overlay',
    type: 'raster',
    paint: { 'raster-opacity': 0.85 },
  }));

  // This doesn't do anything particularly impressive
  // other than recenter the map on null-island.
  const zoomToNullIsland = () => {
    store.dispatch(mapActions.setView([0, 0], 5));
  };

  // Add a random point to the map
  const addRandomPoints = () => {
    // loop over adding a point to the map.
    for (let i = 0; i < 10; i++) {
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

  // Removing features uses MapBox GL Spec filters.
  const removeRandomPoints = () => {
    store.dispatch(mapActions.removeFeatures('points', ['==', 'isRandom', true]));
  };
  // place the map on the page.
  ReactDOM.render(<SdkMap projection="EPSG:4326" store={store} />, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <button className="sdk-btn" onClick={zoomToNullIsland}>Zoom to Null Island</button>
      <button className="sdk-btn" onClick={addRandomPoints}>Add 10 random points</button>
      <button className="sdk-btn blue" onClick={removeRandomPoints}>Remove random points</button>

      <SdkHashHistory store={store} />
    </div>
  ), document.getElementById('controls'));
}

main();
