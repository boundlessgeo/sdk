/*
 * Copyright 2015-present Boundless Spatial Inc., http://boundlessgeo.com
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as mapActions from '../../actions/map';
import { DEFAULT_ZOOM } from '../../constants';

class ZoomSlider extends React.Component {
  render() {
    let className = 'sdk-zoom-slider';
    if (this.props.className) {
      className += ' ' + this.props.className;
    }
    return (
      <div className="sdk-slider-control">
        <input style={this.props.style} className={className} min={this.props.minZoom} max={this.props.maxZoom} value={this.props.zoom} onChange={(evt) => { this.props.onChange(evt.target.value); }} type='range' />
      </div>
    );
  }
}

ZoomSlider.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
};


ZoomSlider.defaultProps = {
  minZoom: DEFAULT_ZOOM.MIN,
  maxZoom: DEFAULT_ZOOM.MAX,
};

function mapStateToProps(state) {
  return {
    zoom: state.map.zoom,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChange: (value) => {
      dispatch(mapActions.setZoom(value));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ZoomSlider);
