/** Geolcation SDK application example.
 *
 *  Contains a Map and demonstrates using geolocation to track the user.
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import SdkMap from '@boundlessgeo/sdk/components/map';
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
    data: {},
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

  // Show the user's current location as a layer.
  store.dispatch(mapActions.addLayer({
    id: 'current-location',
    source: 'points',
    type: 'circle',
    paint: {
      'circle-radius': 13,
      'circle-color': '#149BE9',
      'circle-stroke-color': '#f149BE9',
    },
  }));

  function success(position) {
    document.getElementById('status').innerHTML = '';
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    store.dispatch(mapActions.addFeatures('points', [{
      type: 'Feature',
      properties: {
        title: 'User Location',
      },
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    }]));
    store.dispatch(mapActions.setView([longitude, latitude], 18));
  }

  function error() {
    document.getElementById('status').innerHTML = 'Unable to retrieve your location';
  }

  const initialExtent = () => {
    store.dispatch(mapActions.setView([-93, 45], 2));
    store.dispatch(mapActions.removeFeatures('points', [{
      type: 'Feature',
      properties: {
        title: 'User Location',
      },
    }]));
  };

  // Component to track user's position.
  class TrackPosition extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        locating: false,
      };
    }
    // shouldComponentUpdate(nextState) {
    //   // console.log('nextState', nextState);
    //   if (this.state.loading !== nextState.loading) {
    //     return true;
    //   }
    //   return false;
    // }
    success(position) {
      this.setState({ loading: false });
      // document.getElementById('status').innerHTML = '';
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      store.dispatch(mapActions.addFeatures('points', [{
        type: 'Feature',
        properties: {
          title: 'User Location',
        },
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      }]));
      store.dispatch(mapActions.setView([longitude, latitude], 17));
    }
    geolocate = () => {
      // document.getElementById('status').innerHTML = 'Locating...';
      // this.loading = true;
      console.log(this.props.refreshInterval)
      this.setState({ loading: true });
      navigator.geolocation.getCurrentPosition(success, error);
    };
    render() {
      let loading_icon;
      let status;
      if (this.state.locating) {
        status = 'Stop Tracking';
      } else if (!this.state.locating) {
        status = 'Start Tracking';
      }
      return (
        <div className="tracking">
          <button className="sdk-btn" onClick={this.geolocate}>{ loading_icon } { status }</button>
        </div>
      );
    }
  }

  TrackPosition.propTypes = {
    refreshInterval: PropTypes.number,
    targetSource: PropTypes.string,
    showLocation: PropTypes.bool,
  };

  // place the map on the page.
  ReactDOM.render(<SdkMap store={store} />, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <TrackPosition refreshInterval={3} />
      <button className="sdk-btn" onClick={initialExtent}>Zoom to Initial Extent</button>
      <p id="status" />
    </div>
  ), document.getElementById('controls'));
}

main();
