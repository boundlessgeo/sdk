/** Very basic SDK application example.
 *
 *  Contains a Map and demonstrates some of the dynamics of
 *  using the store.
 *
 */

import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import {Provider} from 'react-redux';

import SdkZoomControl from '@boundlessgeo/sdk/components/map/zoom-control';
import SdkZoomSlider from '@boundlessgeo/sdk/components/map/zoom-slider';
import SdkMousePosition from '@boundlessgeo/sdk/components/map/mouseposition';
import SdkScaleLine from '@boundlessgeo/sdk/components/map/scaleline';
import SdkHashHistory from '@boundlessgeo/sdk/components/history';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import SdkMapInfoReducer from '@boundlessgeo/sdk/reducers/mapinfo';
import {getLayerById} from '@boundlessgeo/sdk/util';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

import RendererSwitch from '../rendererswitch';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
  mapinfo: SdkMapInfoReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
applyMiddleware(thunkMiddleware));

function main() {
  // Start with a reasonable global view of the map.
  store.dispatch(mapActions.setView([-93, 45], 2));

  // Set the map name
  store.dispatch(mapActions.setMapName('Basic Map Example'));

  // Restrict the zoom levels
  store.dispatch(mapActions.updateMetadata({
    'bnd:minzoom': 4,
    'bnd:maxzoom': 20,
  }));

  // add the OSM source
  store.dispatch(mapActions.addOsmSource('osm'));

  // and an OSM layer.
  // Raster layers need not have any paint styles.
  store.dispatch(mapActions.addLayer({
    id: 'osm',
    source: 'osm',
    type: 'raster',
    paint: {
      'raster-opacity': .5,
    },
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
    filter: ['==', 'title', 'Null Island'],
  }));

  // The points source has both null island
  // and random points on it. This layer
  // will style all random points as purple instead
  // of orange.
  store.dispatch(mapActions.addLayer({
    id: 'random-points',
    source: 'points',
    type: 'circle',
    paint: {
      'circle-radius': 5,
      'circle-color': '#756bb1',
      'circle-stroke-color': '#756bb1',
    },
    filter: ['==', 'isRandom', true],
  }));

  // Function to recenter the map on null-island.
  const zoomToNullIsland = () => {
    store.dispatch(mapActions.setView([0, 0], 5));
  };

  // Adds 10 random points to the map
  const addRandomPoints = () => {
    // loop over adding points one-by-one to the map.
    for (let i = 0; i < 10; i++) {
      // 'points' refers to the SOURCE which will get the point feature,
      // the feature is a normal GeoJSON feature definition.
      store.dispatch(mapActions.addFeatures('points', [{
        type: 'Feature',
        properties: {
          title: 'Random Point',
          isRandom: true,
        },
        geometry: {
          type: 'Point',
          // this generates a random point somewhere on the planet, unbounded.
          coordinates: [(Math.random() * 360) - 180, (Math.random() * 180) - 90],
        },
      }]));
    }
  };

  // Removing features uses Mapbox GL Spec filters https://www.mapbox.com/mapbox-gl-js/style-spec/#types-filter.
  const removeRandomPoints = () => {
    store.dispatch(mapActions.removeFeatures('points', ['==', 'isRandom', true]));
  };

  // Component to update map name from user input.
  class InputField extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {value: store.getState().map.name};
      this.handleSubmit = this.handleSubmit.bind(this);
      this.updateMapName = this.updateMapName.bind(this);
    }
    updateMapName(event) {
      this.setState({value: event.target.value});
    }
    handleSubmit(event) {
      event.preventDefault();
      store.dispatch(mapActions.setMapName(this.state.value));
      this.setState({value: ''});
    }
    render() {
      return (
        <div className="mapName">
          <form onSubmit={this.handleSubmit}>
            <div className="mapForm">
              <label className="nameLabel" htmlFor="nameField">Change Map Name in Redux store:</label>
              <input className="nameField" placeholder="Enter new map name here" type="text" id="nameField" value={this.state.value} onChange={this.updateMapName} />
              <button className="sdk-btn" type="submit">Update Map Name</button>
            </div>
          </form>
          <div className="newName">New Redux state.map.name Value: {store.getState().map.name}</div>
        </div>
      );
    }
  }

  class OpacityControl extends React.PureComponent {
    render() {
      const layers = store.getState().map.layers;
      const layer = getLayerById(layers, 'osm');
      const opacity = layer.paint['raster-opacity'] * 100;

      return (
        <div>
          <input
            min="0"
            max="100"
            type="number"
            defaultValue={opacity}
            ref={(me) => {
              this.opacityInput = me;
            }}
          />

          <button
            className="sdk-btn"
            onClick={() => {
              const new_opacity = this.opacityInput.value / 100;

              store.dispatch(mapActions.updateLayer('osm', {
                paint: Object.assign({}, layer.paint, {
                  'raster-opacity': new_opacity,
                })
              }));
            }}
          >
            Change Basemap Opacity
          </button>
        </div>
      );
    }
  }

  // Updates minzoom level on Null Island layer to 2.
  const updateMinzoom = () => {
    store.dispatch(mapActions.updateLayer('null-island', {
      source: 'points',
      type: 'circle',
      paint: {
        'circle-radius': 3,
        'circle-color': '#feb24c',
        'circle-stroke-color': '#f03b20',
      },
      minzoom: 5,
    }));
  };

  // place the map on the page.
  ReactDOM.render(<Provider store={store}>
    <RendererSwitch>
      <SdkScaleLine />
      <SdkMousePosition style={{position: 'absolute', top: 20, right: 12, zIndex: 1, width: '5em'}} />
      <SdkZoomControl />
      <SdkZoomSlider />
    </RendererSwitch>
  </Provider>, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <h3>Try it out</h3>
      <button className="sdk-btn" onClick={zoomToNullIsland}>Zoom to Null Island</button>
      <button className="sdk-btn" onClick={addRandomPoints}>Add 10 random points</button>
      <button className="sdk-btn blue" onClick={removeRandomPoints}>Remove random points</button>
      <button className="sdk-btn" onClick={updateMinzoom}>Change Minimum Zoom Level on Null Island to 5</button>
      <InputField />
      <OpacityControl />

      {/*SdkHashHistory provides a log of coordinates in the url hash*/}
      <SdkHashHistory store={store} />

    </div>
  ), document.getElementById('controls'));
}

main();
