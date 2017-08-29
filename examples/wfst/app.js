/** Very basic SDK application example.
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
import SdkDrawingReducer from '@boundlessgeo/sdk/reducers/drawing';
import * as SdkDrawingActions from '@boundlessgeo/sdk/actions/drawing';
import * as SdkWfsActions from '@boundlessgeo/sdk/actions/wfs';

import { WfsReducer } from '@boundlessgeo/sdk/reducers/wfs';

import WfsController from '@boundlessgeo/sdk/components/wfs';

// MapBox GL Styles does not support WFS layers.
// import SdkWfsReducer from '@boundlessgeo/sdk/reducers/wfs';

import * as SdkMapActions from '@boundlessgeo/sdk/actions/map';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

import './app.css';

import EditPanel from './edit-panel';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
  drawing: SdkDrawingReducer,
  wfs: WfsReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

window.store = store;

function main() {
  // Start with a reasonable global view of the map.
  store.dispatch(SdkMapActions.setView([-93, 45], 2));

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

  const tracts_url = '/geoserver/wfs?SRSNAME=EPSG:3857&REQUEST=GetFeature&TYPENAME=sdk:minnesota_tracts&VERSION=1.1.0&OUTPUTFORMAT=JSON';

  store.dispatch(SdkMapActions.addSource('tracts', {
    type: 'geojson',
    data: tracts_url,
  }));

  // this will configure the source for WFS editing.
  store.dispatch(SdkWfsActions.addSource('tracts',
    '/geoserver/wfs',
    'sdk',
    'sdk',
    'minnesota_tracts',
    'wkb_geometry',
  ));

  // Background layers change the background color of
  // the map. They are not attached to a source.
  store.dispatch(SdkMapActions.addLayer({
    id: 'background',
    type: 'background',
    paint: {
      'background-color': '#eee',
    },
  }));


  // and an OSM layer.
  // Raster layers need not have any paint styles.
  store.dispatch(SdkMapActions.addLayer({
    id: 'osm',
    source: 'osm',
  }));

  const colors = ['#fef0d9','#fdcc8a','#fc8d59','#e34a33','#b30000'];

  for (let i = 0, ii = colors.length; i < ii; i++) {
    store.dispatch(SdkMapActions.addLayer({
      id: `tracts-${i}`,
      type: 'fill',
      source: 'tracts',
      paint: {
        'fill-color': colors[i],
        'fill-opacity': 0.5,
        'fill-outline-color': 'black',
      },
      filter: ['==', 'color', i],
    }));
  }

  const selectFeature = (map, coordinate, feature) => {
    edit_panel.setState({ feature });
  };

  let edit_panel = null;

  const updateFeature = (feature, color) => {
    // change the color
    feature.properties.color = color;
    // clear the selected feature from the panel
    edit_panel.setState({feature: null});
    // trigger a WFS update.
    store.dispatch(SdkWfsActions.updateFeature('tracts', feature));
  }

  const onFinish = (response, action) => {
    store.dispatch(SdkMapActions.updateSource(action.sourceName, {
      data: `${tracts_url}&_random=${Math.random()}`,
    }));
    store.dispatch(SdkDrawingActions.endSelect());
    store.dispatch(SdkDrawingActions.startSelect('tracts'));
  };

  store.dispatch(SdkDrawingActions.startSelect('tracts'));

  // place the map on the page.
  ReactDOM.render(<SdkMap onFeatureSelected={selectFeature} store={store} />, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <p>
        <b>Click on a Census Tract to change its color.</b><br/>
      </p>
      <SdkHashHistory store={store} />

      <EditPanel onChange={ updateFeature } colors={colors} ref={ (pnl) => { edit_panel = pnl; }} />

      <WfsController store={store} onFinishTransaction={ onFinish }/>
    </div>
  ), document.getElementById('controls'));
}

main();
