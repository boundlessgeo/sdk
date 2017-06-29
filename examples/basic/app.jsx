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
      'circle-radius': {
        type: 'interval',
        default: 3,
        property: 'point_count',
        stops: [
          [0, 5], [2, 10], [3, 30],
        ],
      },
      'circle-color': '#feb24c',
      'circle-stroke-color': '#f03b20',
    },
  }));

  // The points source has both null island
  // and random points on it. This layer
  // will style all random points as purple instead
  // of orange.
  store.dispatch(mapActions.addLayer({
    id: 'random-points',
    ref: 'null-island',
    paint: {
      'circle-radius': 5,
      'circle-color': '#756bb1',
      'circle-stroke-color': '#756bb1',
    },
    filter: ['==', 'isRandom', true],
  }));

  /*
   * These are some example calls that were earlier prototyped in
   *  the basic demo. They've been commented out for now but have been
   *  saved for propsperity (and future porting).
   *

  // semaphore to prevent the states layer
  //  from being added twice.
  let sem = true;
  const addLayer = () => {
    if (sem) {
      store.dispatch(mapActions.addSource('states', {
        type: 'raster',
        tileSize: 256,
        tiles: ['https://ahocevar.com/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],
      }));

      store.dispatch(mapActions.addLayer({
        id: 'states',
        source: 'states',
      }));

      sem = false;
    }
  };

  const removeLayer = () => {
    if (!sem) {
      store.dispatch(mapActions.removeLayer('states'));
      store.dispatch(mapActions.removeSource('states'));

      sem = true;
    }
  };

  let semOverlay = true;
  const addOverlay = () => {
    if (semOverlay) {
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

      semOverlay = false;
    }
  };

  const loadContext = () => {
    const url = 'https://raw.githubusercontent.com/boundlessgeo/ol-mapbox-style/master/example/data/wms.json';
    store.dispatch(mapActions.setContext({ url }));
  };

  * End of old demo functions.
  */

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

  // Cluster points on the map
  const clusterPoints = () => {
    store.dispatch(mapActions.clusterPoints('points', !store.getState().map.sources.points.cluster));
  };

  // Removing features uses MapBox GL Spec filters.
  const removeRandomPoints = () => {
    store.dispatch(mapActions.removeFeatures('points', ['==', 'isRandom', true]));
  };

  // Component to update map name from user input.
  class InputField extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = { value: store.getState().map.name };
      this.handleSubmit = this.handleSubmit.bind(this);
      this.updateMapName = this.updateMapName.bind(this);
    }
    updateMapName(event) {
      this.setState({ value: event.target.value });
    }
    handleSubmit(event) {
      event.preventDefault();
      store.dispatch(mapActions.setMapName(this.state.value));
      this.setState({ value: '' });
    }
    render() {
      return (
        <div className="mapName">
          <form onSubmit={this.handleSubmit}>
            <div className="mapForm">
              <label className="nameLabel" htmlFor="nameField">Change Name:</label>
              <input className="nameField" placeholder="Enter new map name here" type="text" id="nameField" value={this.state.value} onChange={this.updateMapName} />
              <button className="sdk-btn" type="submit">Change Map Name</button>
            </div>
          </form>
          <div className="newName">New Map Name: {store.getState().map.name}</div>
        </div>
      );
    }
  }
  // Updates minzoom level on Null Island layer.
  const updateMinzoom = () => {
    store.dispatch(mapActions.updateLayer('null-island', {
      source: 'points',
      type: 'circle',
      paint: {
        'circle-radius': 10,
        'circle-color': '#f03b20',
        'circle-stroke-color': '#f03b20',
      },
      minzoom: 2,
    }));
  };

  // place the map on the page.
  ReactDOM.render(<SdkMap store={store} />, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <button className="sdk-btn" onClick={zoomToNullIsland}>Zoom to Null Island</button>
      <button className="sdk-btn" onClick={addRandomPoints}>Add 10 random points</button>
      <button className="sdk-btn blue" onClick={removeRandomPoints}>Remove random points</button>
      <button className="sdk-btn" onClick={clusterPoints}>Cluster Points</button>
      <button className="sdk-btn" onClick={updateMinzoom}>Update Min Zoom</button>
      <InputField />

      <SdkHashHistory store={store} />
    </div>
  ), document.getElementById('controls'));
}

main();
