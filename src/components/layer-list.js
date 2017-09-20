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

/** SDK Layerlist Component
 */

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { getLayerIndexById, isLayerVisible } from '../util';

import * as mapActions from '../actions/map';

export class SdkLayerListItem extends React.Component {

  moveLayer(layerId, targetId) {
    this.props.dispatch(mapActions.orderLayer(layerId, targetId));
  }

  moveLayerUp() {
    const layer_id = this.props.layer.id;
    const index = getLayerIndexById(this.props.layers, layer_id);
    if (index < this.props.layers.length - 1) {
      this.moveLayer(this.props.layers[index + 1].id, layer_id);
    }
  }

  moveLayerDown() {
    const layer_id = this.props.layer.id;
    const index = getLayerIndexById(this.props.layers, layer_id);
    if (index > 0) {
      this.moveLayer(layer_id, this.props.layers[index - 1].id);
    }
  }

  removeLayer() {
    this.props.dispatch(mapActions.removeLayer(this.props.layer.id));
  }

  toggleVisibility() {
    const shown = isLayerVisible(this.props.layer);
    this.props.dispatch(mapActions.setLayerVisibility(this.props.layer.id, shown ? 'none' : 'visible'));
  }

  getVisibilityControl(layer) {
    const is_checked = isLayerVisible(layer);
    return (
      <input
        type="checkbox"
        onChange={() => { this.toggleVisibility(layer.id, is_checked); }}
        checked={is_checked}
      />
    );
  }

  getTitle() {
    if (this.props.layer.metadata && this.props.layer.metadata['bnd:title']) {
      return this.props.layer.metadata['bnd:title'];
    }
    return this.props.layer.id;
  }

  render() {
    const layer = this.props.layer;
    const checkbox = this.getVisibilityControl(layer);
    return (
      <li className="sdk-layer" key={layer.id}>
        <span className="sdk-checkbox">{checkbox}</span>
        <span className="sdk-name">{this.getTitle()}</span>
      </li>
    );
  }
}

SdkLayerListItem.PropTypes = {
  layer: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
};

class SdkLayerList extends React.Component {
  constructor(props) {
    super(props);

    this.layerClass = connect()(this.props.layerClass);
  }

  render() {
    const layers = [];
    for (let i = this.props.layers.length - 1; i >= 0; i--) {
      layers.push(<this.layerClass key={i} layers={this.props.layers} layer={this.props.layers[i]} />);
    }
    return (
      <ul>
        { layers }
      </ul>
    );
  }
}

SdkLayerList.propTypes = {
  layerClass: PropTypes.func,
  layers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
};

SdkLayerList.defaultProps = {
  layerClass: SdkLayerListItem,
};

function mapStateToProps(state) {
  return {
    layers: state.map.layers,
  };
}

export default connect(mapStateToProps)(SdkLayerList);
