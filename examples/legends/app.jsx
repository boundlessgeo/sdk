/** Legend Examples
 *
 *  Creates a basic map with some features and then
 *  demonstrates the different types of legends available
 *  within SDK!
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import SdkLegend from '@boundlessgeo/sdk/components/legend';
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
  store.dispatch(mapActions.setView([-90, 0], 2));

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
    metadata: {
      'bnd:legend-type': 'href',
      'bnd:legend-content': './osm-legend.html',
    },
  }));

  // 'geojson' sources allow rendering a vector layer
  // with all the features stored as GeoJSON. "data" can
  // be an individual Feature or a FeatureCollection.
  store.dispatch(mapActions.addSource('points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0],
          },
          properties: {
            title: 'Null Island',
            isNullIsland: true,
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-45, 0],
          },
          properties: {
            isNullIsland: false,
          },
        },
      ],
    },
  }));
  // some purple points!
  store.dispatch(mapActions.addLayer({
    id: 'random-points',
    source: 'points',
    paint: {
      'circle-radius': 5,
      'circle-color': '#756bb1',
      'circle-stroke-color': '#756bb1',
    },
    filter: ['==', 'isNullIsland', false],
    metadata: {
      'bnd:legend-type': 'image',
      'bnd:legend-content': './purple-point.png',
    },
  }));

  // Show null island as a layer.
  store.dispatch(mapActions.addLayer({
    id: 'null-island',
    source: 'points',
    type: 'circle',
    metadata: {
      'bnd:legend-type': 'html',
      'bnd:legend-content': 'Null Island is the orange circle on the map.',
    },
    paint: {
      'circle-radius': 3,
      'circle-color': '#feb24c',
      'circle-stroke-color': '#f03b20',
    },
    filter: ['==', 'isNullIsland', true],
  }));

  // Test a WMS Legend
  store.dispatch(mapActions.addSource('states', {
    type: 'raster',
    tileSize: 256,
    tiles: ['https://ahocevar.com/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],
  }));

  store.dispatch(mapActions.addLayer({
    id: 'states',
    source: 'states',
  }));

   // place the map on the page.
  ReactDOM.render(<SdkMap store={store} />, document.getElementById('map'));

  // add some legends to the demo.
  ReactDOM.render((
    <div>
      <h4>Legends</h4>
      <Provider store={store}>
        <div>
          <div className="legend-label">OSM Tiles (href-type legend)</div>
          <SdkLegend layerId="osm" />
          <div className="legend-label">Random Points (image-type legend)</div>
          <SdkLegend layerId="random-points" />
          <div className="legend-label">Null Island (html-type legend)</div>
          <SdkLegend layerId="null-island" />
          <div className="legend-label">U.S. States (wms legend)</div>
          <SdkLegend layerId="states" />
        </div>
      </Provider>
    </div>
  ), document.getElementById('controls'));
}

main();
