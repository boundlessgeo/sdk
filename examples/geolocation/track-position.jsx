import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// import { createStore, combineReducers, applyMiddleware } from 'redux';
// import thunkMiddleware from 'redux-thunk';

// import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

/* eslint-disable no-underscore-dangle */
// const store = createStore(combineReducers({
//   map: SdkMapReducer,
// }), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
//    applyMiddleware(thunkMiddleware));

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
    // store.dispatch(mapActions.addFeatures(this.props.targetSource, [{
    this.props.addFeatures(this.props.targetSource, [{
      type: 'Feature',
      properties: {
        title: 'User Location',
      },
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    }]);
    // store.dispatch(mapActions.setView([longitude, latitude], 17));
    this.props.setView([longitude, latitude], 17);
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
    clearInterval(this.intervalId);
    this.notLocating();
    // store.dispatch(mapActions.setView([-93, 45], 2));
    this.props.setView([-93, 45], 2);
    // store.dispatch(mapActions.removeFeatures(this.props.targetSource, [{
    this.props.removeFeatures(this.props.targetSource, [{
      type: 'Feature',
      properties: {
        title: 'User Location',
      },
    }]);
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
  addFeatures: PropTypes.func,
  setView: PropTypes.func,
  removeFeatures: PropTypes.func,
  showLocation: PropTypes.bool,
  targetSource: PropTypes.string.isRequired,
  refreshInterval: PropTypes.number,
};

TrackPosition.defaultProps = {
  addFeatures: () => { },
  setView: () => { },
  removeFeatures: () => { },
  showLocation: false,
  refreshInterval: 10000,
};

function mapDispatch(dispatch) {
  return {
    dispatch,
    addFeatures: (sourceName, features) => {
      dispatch(mapActions.addFeatures(sourceName, features));
    },
    setView: (center, zoom) => {
      dispatch(mapActions.setView(center, zoom));
    },
    removeFeatures: (sourceName, filter) => {
      dispatch(mapActions.setView(sourceName, filter));
    },
  };
}

export default connect(mapDispatch)(TrackPosition);
