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

  // const initialExtent = () => {
  //   store.dispatch(mapActions.setView([-93, 45], 2));
  //   store.dispatch(mapActions.removeFeatures('points', [{
  //     type: 'Feature',
  //     properties: {
  //       title: 'User Location',
  //     },
  //   }]));
  // };

  // Component to track user's position.
  class TrackPosition extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        locating: false,
        error: false,
      };
      this.intervalId = null;
      this.geolocate = this.geolocate.bind(this);
      this.success = this.success.bind(this);
      this.error = this.error.bind(this);
      this.isLocating = this.isLocating.bind(this);
      this.notLocating = this.notLocating.bind(this);
      this.findUser = this.findUser.bind(this);
      this.initialExtent = this.initialExtent.bind(this);
    }
    isLocating() {
      this.setState({ locating: true });
    }
    notLocating() {
      this.setState({ locating: false });
    }
    success(position) {
      this.setState({ error: false });
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      store.dispatch(mapActions.addFeatures(this.props.targetSource, [{
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
      this.setState({ latitude, longitude });
      // this.notLocating();
    }
    error() {
      // this.notLocating();
      this.setState({ error: true });
    }
    findUser() {
      // this.isLocating();
      navigator.geolocation.getCurrentPosition(this.success, this.error);
    }
    geolocate() {
      this.isLocating();
      this.intervalId = setInterval(this.findUser, this.props.refreshInterval);
    }
    initialExtent() {
      this.notLocating();
      store.dispatch(mapActions.setView([-93, 45], 2));
      store.dispatch(mapActions.removeFeatures(this.props.targetSource, [{
        type: 'Feature',
        properties: {
          title: 'User Location',
        },
      }]));
    }
    render() {
      let statusText;
      if (this.state.locating === true) {
        statusText =
          (<div>Locating!</div>);
      } else if (this.state.locating === false) {
        statusText =
          (<div>Locate Me!</div>);
      }
      let errorText;
      if (this.state.error === true) {
        errorText = (<div>Error retrieving your location</div>);
      }
      let currentLocation;
      if (this.props.showLocation && (this.state.latitude && this.state.longitude)) {
        currentLocation = (
          <div>Current Location: {this.state.latitude}, {this.state.longitude}</div>
        );
      }
      return (
        <div className="tracking">
          <button className="sdk-btn" onClick={this.geolocate}>Geolocate</button>
          <button className="sdk-btn" onClick={this.initialExtent}>Zoom to Initial Extent and Stop Locating</button>
          <div>{ currentLocation }</div>
          <div>{ statusText }</div>
          <div>{ errorText }</div>
        </div>
      );
    }
  }

  TrackPosition.propTypes = {
    showLocation: PropTypes.bool,
    targetSource: PropTypes.string.isRequired,
    refreshInterval: PropTypes.number,
  };

  TrackPosition.defaultProps = {
    showLocation: false,
    refreshInterval: 10000,
  };

  // place the map on the page.
  ReactDOM.render(<SdkMap store={store} />, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <TrackPosition targetSource={'points'} />
    </div>
  ), document.getElementById('controls'));
}

main();
