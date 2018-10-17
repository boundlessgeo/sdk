/** Demo of layer list in an SDK map.
 *
 *  Contains a Map and demonstrates adding many types of layers
 *  And a layer list component to manage the layers
 *
 */

import {createStore, combineReducers} from 'redux';

import React from 'react';
import ReactDOM from 'react-dom';
import {DragDropContext, DragSource, DropTarget} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {types, layerListItemSource, layerListItemTarget, collect, collectDrop} from '@boundlessgeo/sdk/components/layer-list-item';
import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkZoomControl from '@boundlessgeo/sdk/components/map/zoom-control';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

import SdkLayerList from '@boundlessgeo/sdk/components/layer-list';
import SdkLayerListItem from '@boundlessgeo/sdk/components/layer-list-item';

import {Provider} from 'react-redux';

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
        <button className='sdk-btn' onClick={() => {
          this.moveLayerUp();
        }}>
          { this.props.labels.up }
        </button>
        <button className='sdk-btn' onClick={() => {
          this.moveLayerDown();
        }}>
          { this.props.labels.down }
        </button>
        <button className='sdk-btn' onClick={() => {
          this.removeLayer();
        }}>
          { this.props.labels.remove }
        </button>
      </span>
    );

    return  this.props.connectDragSource(this.props.connectDropTarget((
      <li className='layer'>
        <span className='checkbox'>{checkbox}</span>
        <span className='name'>{layer.id}</span>
        <span className='btn-container'>{moveButtons}</span>
      </li>
    )));
  }
}

LayerListItem.defaultProps = {
  labels: {
    up: 'Move up',
    down: 'Move down',
    remove: 'Remove layer',
  },
};

LayerListItem = DropTarget(types, layerListItemTarget, collectDrop)(DragSource(types, layerListItemSource, collect)(LayerListItem));

function main() {
  // Start with a reasonable global view of hte map.
  store.dispatch(mapActions.setView([-93, 45], 2));

  store.dispatch(mapActions.updateMetadata({
    'mapbox:groups': {
      base: {
        name: 'Base Maps',
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
    metadata: {
      'bnd:hide-layerlist': true,
    },
  }));

  // add the OSM source
  store.dispatch(mapActions.addOsmSource('osm'));

  // and an OSM layer.
  // Raster layers need not have any paint styles.
  store.dispatch(mapActions.addLayer({
    id: 'osm',
    source: 'osm',
    type: 'raster',
    metadata: {
      'mapbox:group': 'base'
    }
  }));

  // add carto source
  store.dispatch(mapActions.addSource('cartolight', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    type: 'raster',
    tileSize: 256,
    tiles: [
      'http://s.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    ],
  }));

  // add an carto light layer
  store.dispatch(mapActions.addLayer({
    metadata: {
      'mapbox:group': 'base',
      'bnd:title': 'CartoDB light',
    },
    type: 'raster',
    layout: {
      visibility: 'none',
    },
    id: 'cartolight',
    source: 'cartolight',
  }));

  // 'geojson' sources allow rendering a vector layer
  // with all the features stored as GeoJSON. "data" can
  // be an individual Feature or a FeatureCollection.
  store.dispatch(mapActions.addSource('dynamic-source', {type: 'geojson'}));

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
      {type: 'geojson', data: './data/airports.json'}));
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
    type: 'raster',
  }));

  // place the map on the page.
  ReactDOM.render(<Provider store={store}>
    <SdkMap>
      <SdkZoomControl />
    </SdkMap>
  </Provider>, document.getElementById('map'));

  // Add DND to the LayerList
  const DragDropLayerList = DragDropContext(HTML5Backend)(SdkLayerList);

  ReactDOM.render((
    <div>
      <h3>Try it out</h3>
      <div className='sdk-layerlist'>
        <Provider store={store}>
          <DragDropLayerList layerClass={LayerListItem} />
        </Provider>
      </div>
    </div>
  ), document.getElementById('controls'));
}

main();
