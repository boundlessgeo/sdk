/** Demo of layer list in an SDK map.
 *
 *  Contains a Map and demonstrates adding many types of layers
 *  And a layer list component to manage the layers
 *
 */

import { createStore, combineReducers } from 'redux';

import React from 'react';
import ReactDOM from 'react-dom';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

import SdkLayerList from '@boundlessgeo/sdk/components/layer-list';
import { SdkLayerListItem } from '@boundlessgeo/sdk/components/layer-list';

import { Provider } from 'react-redux';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

class LayerListItem extends SdkLayerListItem {
  render() {
    const layer = this.props.layer;
    const checkbox = this.getVisibilityControl(layer);

    const moveButtons = (
      <span>
        <button className="sdk-btn" onClick={() => { this.moveLayerUp(); }}>
          { this.props.labels.up }
        </button>
        <button className="sdk-btn" onClick={() => { this.moveLayerDown(); }}>
          { this.props.labels.down }
        </button>
        <button className="sdk-btn" onClick={() => { this.removeLayer(); }}>
          { this.props.labels.remove }
        </button>
      </span>
    );

    return (
      <li className="layer">
        <span className="checkbox">{checkbox}</span>
        <span className="name">{layer.id}</span>
        <span className="btn-container">{moveButtons}</span>
      </li>
    );
  }
}

LayerListItem.defaultProps = {
  labels: {
    up: 'Move up',
    down: 'Move down',
    remove: 'Remove layer',
  },
};

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

  // This is called by the onClick, keeping the onClick HTML clean
  const runFetchGeoJSON = () => {
    store.dispatch(mapActions.addSource('dynamic-source',
      { type: 'geojson', data: './data/airports.json' }));
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
    tiles: ['https://demo.boundlessgeo.com/geoserver/usa/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],
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
      <h3>Try it out</h3>
      <div className="sdk-layerlist">
        <Provider store={store}>
          <SdkLayerList layerClass={LayerListItem} />
        </Provider>
      </div>
    </div>
  ), document.getElementById('controls'));
}

main();
