/** Demo of clustered points in an SDK map.
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
import SdkDrawingReducer from '@boundlessgeo/sdk/reducers/drawing';
import * as mapActions from '@boundlessgeo/sdk/actions/map';
import * as drawingActions from '@boundlessgeo/sdk/actions/drawing';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.css';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
  drawing: SdkDrawingReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

window.store = store;

function main() {
  // Start with a reasonable global view of hte map.
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

  // Add three individual GeoJSON stores for the
  // three different geometry types.
  ['points', 'lines', 'polygons'].forEach((geo_type) => {
    store.dispatch(mapActions.addSource(geo_type, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    }));
  });

  // setup the points layer
  store.dispatch(mapActions.addLayer({
    id: 'points',
    source: 'points',
    type: 'circle',
    paint: {
      'circle-radius': 5,
      'circle-color': '#feb24c',
      'circle-stroke-color': '#f03b20',
    },
  }));

  // setup the lines layer
  store.dispatch(mapActions.addLayer({
    id: 'linie',
    source: 'lines',
    type: 'line',
    paint: {
      'line-color': '#f03b20',
      'line-width': 5,
    },
  }));

  // setup the polys layer
  store.dispatch(mapActions.addLayer({
    id: 'polys',
    source: 'polygons',
    type: 'fill',
    paint: {
      'fill-opacity': 0.7,
      'fill-color': '#feb24c',
      'fill-outline-color': '#f03b20',
    },
  }));

  let FEATURE_ID = 1;

  // Promises are used here as a way to demonstrate that the
  // features could be added asynchronously.  This is useful
  // in cases in which the feature may need validated by the
  // server before being added to the layer.
  const validateFeature = (sourceName, feature) => {
    const p = new Promise((resolve, reject) => {
      const geom_types = {
        points: 'Point',
        lines: 'LineString',
        polygons: 'Polygon',
      };

      if (feature.geometry.type === geom_types[sourceName]) {
        const new_feature = Object.assign({}, feature, {
          properties: {
            id: FEATURE_ID,
          },
        });
        FEATURE_ID += 1;
        resolve(new_feature);
      } else {
        reject('Feature geometry-type does not match source geometry-type.');
      }
    });

    return p;
  };

  let error_div = null;

  // When the feature is drawn on the map, validate it and
  //  then add it to the source.
  const addFeature = (map, sourceName, proposedFeature) => {
    validateFeature(sourceName, proposedFeature)
      .then((feature) => {
        store.dispatch(mapActions.addFeatures(sourceName, feature));
        error_div.innerHTML = `Featured ${feature.properties.id} added.`;
      })
      .catch((msg) => {
        if (error_div !== null) {
          error_div.innerHTML = msg;
        }
      });
  };

  const modifyFeature = (map, sourceName, feature) => {
    store.dispatch(mapActions.removeFeatures(sourceName, ['==', 'id', feature.properties.id]));
    store.dispatch(mapActions.addFeatures(sourceName, [feature]));
    error_div.innerHTML = `Feature ${feature.properties.id} modified.`;
  };

  // place the map on the page.
  ReactDOM.render(
    <SdkMap
      store={store}
      onFeatureDrawn={addFeature}
      onFeatureModified={modifyFeature}
    />
  , document.getElementById('map'));

  let drawing_tool = null;
  let drawing_layer = 'points';

  // when either the tool or layer changes,
  //  trigger a change to the drawing.
  const updateInteraction = () => {
    if (drawing_tool === 'none') {
      store.dispatch(drawingActions.endDrawing());
    } else if (drawing_layer !== null) {
      store.dispatch(drawingActions.startDrawing(drawing_layer, drawing_tool));
    }
  };

  const setLayer = (evt) => {
    drawing_layer = evt.target.value;
    updateInteraction();
  };

  const setDrawingTool = (evt) => {
    drawing_tool = evt.target.value;
    updateInteraction();
  };

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <div className="control-panel">
        <h4>Layers</h4>
        <select onChange={setLayer}>
          <option value="points">Points</option>
          <option value="lines">Lines</option>
          <option value="polygons">Polygons</option>
        </select>
      </div>
      <div className="control-panel">
        <h4>Drawing tools</h4>
        <select onChange={setDrawingTool}>
          <option value="none">None</option>
          <option value="Point">Draw point</option>
          <option value="LineString">Draw line</option>
          <option value="Polygon">Draw polygon</option>
          <option value="Modify">Modify feature</option>
        </select>
      </div>
      <div className="control-panel">
        <h4>Messages</h4>
        <div ref={(d) => { error_div = d; }}>
          Use the select boxes at left to draw on the map.
        </div>
      </div>
    </div>
  ), document.getElementById('controls'));
}

main();
