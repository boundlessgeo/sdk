/** Demo of using the drawing, modify, and select interactions.
 *
 */

import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import {Provider} from 'react-redux';

import RendererSwitch from '../rendererswitch';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import SdkDrawingReducer from '@boundlessgeo/sdk/reducers/drawing';
import SdkZoomControl from '@boundlessgeo/sdk/components/map/zoom-control';
import * as mapActions from '@boundlessgeo/sdk/actions/map';
import * as drawingActions from '@boundlessgeo/sdk/actions/drawing';

import {INTERACTIONS} from '@boundlessgeo/sdk/constants';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

// include a MeasureTable component for this app.
import MeasureTable from './measure-table';


/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
  drawing: SdkDrawingReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
applyMiddleware(thunkMiddleware));

function main() {
  // Start with a reasonable global view of hte map.
  store.dispatch(mapActions.setView([-15, 30], 2));

  // add the OSM source
  store.dispatch(mapActions.addOsmSource('osm'));

  // and an OSM layer.
  // Raster layers need not have any paint styles.
  store.dispatch(mapActions.addLayer({
    id: 'osm',
    source: 'osm',
    type: 'raster',
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
  store.dispatch(drawingActions.setEditStyle([
    {
      'id': 'gl-draw-line',
      'type': 'line',
      'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-color': '#D20C0C',
        'line-dasharray': [0.2, 2],
        'line-width': 2
      }
    },
    {
      'id': 'gl-draw-polygon-fill-inactive',
      'type': 'fill',
      'filter': ['all',
        ['==', '$type', 'Polygon'],
      ],
      'paint': {
        'fill-color': '#fbb03b',
        'fill-outline-color': '#fbb03b',
        'fill-opacity': 0.1
      }
    },
    {
      'id': 'gl-draw-polygon-midpoint',
      'type': 'circle',
      'filter': ['all',
        ['==', '$type', 'Point']],
      'paint': {
        'circle-radius': 3,
        'circle-color': '#fbb03b'
      }
    }
  ]));

  // A counter for the feature IDs
  let FEATURE_ID = 1;

  // Promises are used here as a way to demonstrate that the
  // features could be added asynchronously.  This is useful
  // in cases in which the feature may need validation by the
  // server before being added to the layer.
  const validateFeature = (sourceName, feature) => {
    const p = new Promise((resolve, reject) => {
      // Each source is intended to store a specific
      // type of geometry.
      const geom_types = {
        points: 'Point',
        lines: 'LineString',
        polygons: 'Polygon',
      };

      // verify the geometry type matches the source.
      if (feature.geometry.type === geom_types[sourceName]) {
        // define the new feature with an ID.
        const new_feature = Object.assign({}, feature, {
          properties: {
            id: FEATURE_ID,
          },
        });
        FEATURE_ID += 1;

        // resolving the feature will pass it down the chain.
        resolve(new_feature);
      } else {
        reject('Feature geometry-type does not match source geometry-type.');
      }
    });

    return p;
  };

  // Reference a div which can hold messages.
  let error_div = null;

  // When the feature is drawn on the map, validate it and
  //  then add it to the source.
  const addFeature = (map, sourceName, collection) => {
    const proposedFeature = collection.features[0];
    // This calls the validation function which returns a Promise.
    validateFeature(sourceName, proposedFeature)
      .then((feature) => {
        // if the feature passes the validation, then add it to the source.
        store.dispatch(mapActions.addFeatures(sourceName, feature));
        // and let the user know
        error_div.innerHTML = `Feature ${feature.properties.id} added.`;
      })
      .catch((msg) => {
        if (error_div !== null) {
          error_div.innerHTML = msg;
        }
      });
  };

  // As redux doesn't really have an "update" as state
  //  is immutable. The method here is to remove the old feature,
  //  then immediate create a new one with our changes.
  const modifyFeature = (map, sourceName, collection) => {
    const feature = collection.features[0];
    store.dispatch(mapActions.removeFeatures(sourceName, ['==', 'id', feature.properties.id]));
    store.dispatch(mapActions.addFeatures(sourceName, [feature]));
    // let the user know what happened.
    error_div.innerHTML = `Feature ${feature.properties.id} modified.`;
  };

  // Selecting a feature displays its ID.
  const selectFeature = (map, sourceName, collection) => {
    const ids = [];
    for (let i = 0, ii = collection.features.length; i < ii; ++i) {
      ids.push(collection.features[i].properties.id);
    }
    error_div.innerHTML = `Feature(s) with ID ${ids.join(', ')} selected.`;
  };

  // Deselecting a feature displays its ID.
  const deselectFeature = (map, sourceName, collection) => {
    const ids = [];
    for (let i = 0, ii = collection.features.length; i < ii; ++i) {
      ids.push(collection.features[i].properties.id);
    }
    error_div.innerHTML = `Feature(s) with ID ${ids.join(', ')} deselected.`;
  };

  // place the map on the page.
  ReactDOM.render(<Provider store={store}>
    <RendererSwitch
      style={{position: 'relative'}}
      onFeatureDrawn={addFeature}
      onFeatureModified={modifyFeature}
      onFeatureSelected={selectFeature}
      onFeatureDeselected={deselectFeature}
    >
      <SdkZoomControl style={{position: 'absolute', top: 20, left: 20}}/>
    </RendererSwitch>
  </Provider>, document.getElementById('map'));

  let drawing_tool = null;
  let drawing_layer = 'points';

  // when either the tool or layer changes,
  //  trigger a change to the drawing.
  const updateInteraction = () => {
    if (drawing_tool === 'none') {
      store.dispatch(drawingActions.endDrawing());
    } else if (drawing_layer !== null) {
      // direct_select mode doesn't handle point features
      const mode = drawing_layer !== 'points' ? 'direct_select' : undefined;
      store.dispatch(drawingActions.startDrawing(drawing_layer, drawing_tool, mode));
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
      <h3>Try it out</h3>
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
          <option value={INTERACTIONS.measure_point}>Measure point</option>
          <option value={INTERACTIONS.measure_line}>Measure line</option>
          <option value={INTERACTIONS.measure_polygon}>Measure polygon</option>
          <option value={INTERACTIONS.point}>Draw point</option>
          <option value={INTERACTIONS.line}>Draw line</option>
          <option value={INTERACTIONS.polygon}>Draw polygon</option>
          <option value={INTERACTIONS.box}>Draw box</option>
          <option value={INTERACTIONS.modify}>Modify feature</option>
          <option value={INTERACTIONS.select}>Select feature</option>
        </select>
      </div>
      <div className="control-panel">
        <MeasureTable store={store} />
      </div>
      <div className="control-panel">
        <h4>Messages</h4>
        <div ref={(d) => {
          error_div = d;
        }}>
          Use the select boxes at left to draw on the map.
        </div>
      </div>
    </div>
  ), document.getElementById('controls'));
}

main();
