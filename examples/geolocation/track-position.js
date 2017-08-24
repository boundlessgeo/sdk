import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import OlGeolocation from 'ol/geolocation';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

function rounded(num) {
  return (Math.round(num * 100) / 100);
}

// Component to track user's position.
class TrackPosition extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
    };
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
    this.setState({ locating: false, error: false });
  }
  success(position) {
    this.setState({ error: false });
    if (this.state.latitude || this.state.longitude) {
      this.props.removeFeatures(this.props.targetSource, [['==', 'title', 'User Location']]);
    }
    if (this.state.locating === true) {
      const latitude = position[1];
      const longitude = position[0];
      // if the target source already exists]
      if (this.props.sources[this.props.targetSource] !== undefined) {
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
      } else {
        let newSourceName;
        // if the target source has been declared but is not yet known on the map
        if (this.props.targetSource !== undefined) {
          newSourceName = this.props.targetSource;
        // the target source has not been declared
        } else {
          newSourceName = 'newSource';
        }
        this.props.addSource(newSourceName, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              title: 'User Location',
            },
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
          },
        });
        this.props.addLayer({
          id: 'new-location',
          source: newSourceName,
          type: 'circle',
          paint: {
            'circle-radius': 13,
            'circle-color': '#149BE9',
            'circle-stroke-color': '#f149BE9',
          },
        });
      }
      this.props.setView([longitude, latitude], 17);
      this.setState({ latitude, longitude });
    }
  }
  error() {
    this.setState({ error: true });
  }
  findUser() {
    const position = this.location.getPosition();
    if (position) {
      this.success(position);
    } else {
      this.error();
    }
  }
  geolocate() {
    this.isLocating();
    this.location = new OlGeolocation({
      tracking: true,
    });
    this.location.on('error', () => {
      this.error();
    });
    this.location.on('change', () => {
      this.findUser();
    });
  }
  initialExtent() {
    if (this.location) {
      this.location.setTracking(false);
      this.notLocating();
      this.props.setView([-93, 45], 2);
      this.setState({ latitude: null, longitude: null });
      if (this.props.sources[this.props.targetSource] !== undefined) {
        this.props.removeFeatures(this.props.targetSource, [['==', 'title', 'User Location']]);
      }
    }
  }
  render() {
    let status;
    let currentLocation;
    if (this.state.locating === true) {
      status =
        (<span className="tracking"><i className="ms ms-geolocation" /><i> Tracking... </i></span>);
      if (this.props.showLocation && (this.state.latitude && this.state.longitude)) {
        currentLocation = (
          <span className="tracking">
            -- Current Location: {rounded(this.state.latitude)}, {rounded(this.state.longitude)} --
          </span>
        );
      }
    }
    let errorText;
    if (this.state.locating && this.state.error) {
      errorText = (<span><i>Error retrieving your location</i></span>);
    }
    return (
      <div>
        <button className="sdk-btn" onClick={this.geolocate}>Geolocate</button>
        { status } { currentLocation } { errorText }
        <div>
          <button className="sdk-btn" onClick={this.initialExtent}>Stop Locating and Zoom to Initial Extent</button>
        </div>
      </div>
    );
  }
}

TrackPosition.propTypes = {
  // eslint-disable-next-line
  sources: PropTypes.object,
  addFeatures: PropTypes.func,
  setView: PropTypes.func,
  removeFeatures: PropTypes.func,
  addSource: PropTypes.func,
  addLayer: PropTypes.func,
  showLocation: PropTypes.bool,
  targetSource: PropTypes.string,
};

TrackPosition.defaultProps = {
  sources: {},
  addFeatures: () => { },
  setView: () => { },
  removeFeatures: () => { },
  addSource: () => { },
  addLayer: () => { },
  showLocation: true,
  targetSource: 'New',
};

function mapStateToProps(state) {
  return {
    sources: state.map.sources,
  };
}

function mapDispatch(dispatch) {
  return {
    addFeatures: (sourceName, features) => {
      dispatch(mapActions.addFeatures(sourceName, features));
    },
    setView: (center, zoom) => {
      dispatch(mapActions.setView(center, zoom));
    },
    removeFeatures: (sourceName, filter) => {
      dispatch(mapActions.removeFeatures(sourceName, filter));
    },
    addSource: (sourceName, sourceDef) => {
      dispatch(mapActions.addSource(sourceName, sourceDef));
    },
    addLayer: (layerDef) => {
      dispatch(mapActions.addLayer(layerDef));
    },
  };
}

export default connect(mapStateToProps, mapDispatch)(TrackPosition);
