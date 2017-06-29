/** Track the history of the map in the hash.
 *
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { setView } from '../actions/map';
import { parseQueryString, encodeQueryObject } from '../util';

function proposeFloat(value, defaultValue) {
  const proposed = parseFloat(value);
  if (typeof proposed === 'number' && isFinite(proposed)) {
    return proposed;
  }
  return defaultValue;
}

export class HashHistory extends React.Component {
  /** Ensure the hash is restored if already set
   */
  componentWillMount() {
    // without this, render() will overwrite what is in the URL.
    this.onHashChange();
  }

  /** After the component has mounted,
   *  add a listener for the history changes.
   */
  componentDidMount() {
    // addEventListener is supported in IE9+
    window.addEventListener('hashchange', () => {
      this.onHashChange();
    });
  }

  shouldComponentUpdate(nextProps) {
    // this only listens for the center and zoom
    //  to change but props.map contains a lot more data.
    return (
      this.props.map.center[0] !== nextProps.map.center[0]
      || this.props.map.center[1] !== nextProps.map.center[1]
      || this.props.map.zoom !== nextProps.map.zoom
      || this.props.map.rotation !== nextProps.map.rotation
    );
  }

  /** When the hash changes, attempt to parse a location
   *  from the URL.
   */
  onHashChange() {
    // get the hash and remove the leading '#'
    const hash = window.location.hash.substring(1);
    const parsed_hash = parseQueryString(hash);

    // pass along the now parsed hash to the delegate functions.
    this.parseLocationHash(parsed_hash);
  }

  /** Encode the location in an object appropriate
   *  for hash-encoding.
   *
   *  @returns an Object with x,y,z members.
   */
  getLocationStateObject() {
    return {
      x: this.props.map.center[0].toFixed(5),
      y: this.props.map.center[1].toFixed(5),
      z: this.props.map.zoom,
      r: this.props.map.rotation ? this.props.map.rotation : 0,
    };
  }

  /** Create an object which will be encoded in the hash
   *
   *  This object should represent a limited amount of state
   *  which is appropriate for hash-encoding.
   *
   */
  getStateObject() {
    return Object.assign(
      {},
      this.getLocationStateObject(),
    );
  }

  /** Parse the location from the hash.
   *
   *  @param parsedHash The object resulting from parseQueryString of the hash.
   *
   */
  parseLocationHash(parsedHash) {
    // create copies of the current center and zoom
    const center = this.props.map.center;

    const new_center = [
      proposeFloat(parsedHash.x, center[0]),
      proposeFloat(parsedHash.y, center[1]),
    ];

    const zoom = proposeFloat(parsedHash.z, this.props.map.zoom);

    // change the view.
    this.props.setView(new_center, zoom);
  }

  /** Encode the state for the URL hash.
   */
  encodeState() {
    const st = this.getStateObject();
    return encodeQueryObject(st);
  }

  render() {
    // set the hash as appropriate.
    window.location.hash = `#${this.encodeState()}`;

    // this doesn't actually contribute anything to the DOM!
    return false;
  }
}

HashHistory.propTypes = {
  map: PropTypes.shape({
    center: PropTypes.arrayOf(PropTypes.number),
    zoom: PropTypes.number,
    rotation: PropTypes.number,
  }),
  setView: PropTypes.func,
};


HashHistory.defaultProps = {
  map: {
    center: [0, 0],
    zoom: 1,
    rotation: 0,
  },
  setView: () => {
  },
};

function mapStateToProps(state) {
  return {
    map: state.map,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setView: (center, zoom) => {
      dispatch(setView(center, zoom));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(HashHistory);
