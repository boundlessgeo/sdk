/** Very basic SDK application example with a feature table and some data fetch
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
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

import { reprojectGeoJson } from '@boundlessgeo/sdk/util';

import fetch from 'isomorphic-fetch';


// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

// Use app.css to style current app

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  // Start with a view of the sample data location
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

  // Background layers change the background color of
  // the map. They are not attached to a source.
  store.dispatch(mapActions.addLayer({
    id: 'background',
    type: 'background',
    paint: {
      'background-color': '#eee',
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
      // addFeatures with the features, source name
      .then(json => store.dispatch(mapActions.addFeatures(sourceName,
        reprojectGeoJson(json.features, json.crs))));
  };

  // This is called by the onClick, keeping the onClick HTML clean
  const runFetchGeoJSON = () => {
    const url = './data/airports.json';
    addLayerFromGeoJSON(url, 'dynamic-source');
  };

  // Next few functions are all about building the feature Table

  // Next few functions are all about building the feature Table
  // Read the source and get all the possible properties
  const getTableHeaders = (sourceName) => {
    const features = store.getState().map.sources[sourceName].data.features;
    const headers = [];
    // Loop over features
    for (let i = 0, ii = features.length; i < ii; i++) {
      // Build a list of unique properties for the header list
      const temp = Object.keys(features[i].properties);
      for (let j = 0, jj = temp.length; j < jj; j++) {
        // if the feature.properties is new add it to headers
        if (headers.indexOf(temp[j]) < 0) {
          headers.push(temp[j]);
        }
      }
    }
    return headers;
  };

  // Build out the headers based on supplied list of properties
  const buildTableHeader = (properties) => {
    const th = [];
    for (let i = 0, ii = properties.length; i < ii; i++) {
      th.push(<th key={properties[i]}>{properties[i]}</th>);
    }
    return (<thead><tr>{th}</tr></thead>);
  };

  // Build the body of the table based on list of properties and source store in redux store
  const buildTableBody = (properties, sourceName) => {
    const body = [];
    let row = [];
    // Get all the features from the Redux store
    const features = store.getState().map.sources[sourceName].data.features;
    // Loop over features
    for (let i = 0, ii = features.length; i < ii; i++) {
      // Loop over properties
      for (let j = 0, jj = properties.length; j < jj; j++) {
        // Build list of properties for each feature
        row.push(<td key={j}>{features[i].properties[properties[j]]}</td>);
      }
      // add the features properties to the list
      body.push(<tr key={i}>{row}</tr>);
      // Reset the row
      row = [];
    }
    // Return the body
    return (<tbody>{body}</tbody>);
  };
  // Show the data in a table
  const displayTable = () => {
    // Get full list of properties
    const propertyList = getTableHeaders('dynamic-source');
    // This would be a good point to filter out any
    // unwanted properties such as GUID from the propertyList

    // Build table header
    const tableHeader = buildTableHeader(propertyList);
    // Build table body
    const tableBody = buildTableBody(propertyList, 'dynamic-source');

    // Place the table on the page
    ReactDOM.render((
      <table className="sdk-table">
        {tableHeader}
        {tableBody}
      </table>), document.getElementById('table'));
  };
  // place the map on the page.
  ReactDOM.render(<SdkMap store={store} />, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <button className="sdk-btn" onClick={runFetchGeoJSON}>Fetch Data</button>
      <button className="sdk-btn" onClick={displayTable}>Show the data in a table</button>
    </div>
  ), document.getElementById('controls'));
}

main();
