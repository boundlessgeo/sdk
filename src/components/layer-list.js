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

import { getLayerIndexById, isLayerVisible, getLayerTitle } from '../util';

import * as mapActions from '../actions/map';
import {LAYERLIST_HIDE_KEY, GROUP_KEY, GROUPS_KEY} from '../constants';

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
    if (this.props.exclusive) {
      this.props.dispatch(mapActions.setLayerInGroupVisible(this.props.layer.id, this.props.groupId));
    } else {
      this.props.dispatch(mapActions.setLayerVisibility(this.props.layer.id, shown ? 'none' : 'visible'));
    }
  }

  getVisibilityControl() {
    const layer = this.props.layer;
    const is_checked = isLayerVisible(layer);
    if (this.props.exclusive) {
      return (
        <input
          type="radio"
          name={this.props.groupId}
          onChange={() => { this.toggleVisibility(); }}
          checked={is_checked}
        />
      );
    } else {
      return (
        <input
          type="checkbox"
          onChange={() => { this.toggleVisibility(); }}
          checked={is_checked}
        />
      );
    }
  }

  render() {
    const layer = this.props.layer;
    const checkbox = this.getVisibilityControl();
    return (
      <li className="sdk-layer" key={layer.id}>
        <span className="sdk-checkbox">{checkbox}</span>
        <span className="sdk-name">{getLayerTitle(this.props.layer)}</span>
      </li>
    );
  }
}

SdkLayerListItem.PropTypes = {
  exclusive: PropTypes.bool,
  groupId: PropTypes.string,
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
    let className = 'sdk-layer-list';
    if (this.props.className) {
      className = `${className} ${this.props.className}`;
    }
    let i;
    const layers = [];
    const groups = this.props.metadata ? this.props.metadata[GROUPS_KEY] : undefined;
    const layersHash = {};
    if (groups) {
      for (var key in groups) {
        const children = [];
        for (i = this.props.layers.length - 1; i >= 0; i--) {
          const item = this.props.layers[i];
          if (item.metadata && item.metadata[LAYERLIST_HIDE_KEY] !== true && item.metadata[GROUP_KEY] === key) {
            layersHash[item.id] = true;
            children.push(<this.layerClass exclusive={groups[key].exclusive} groupId={key} key={i} layers={this.props.layers} layer={item} />);
          }
        }
        if (children.length > 0) {
          layers.push(<li key={key}>{groups[key].name}<ul>{children}</ul></li>);
        }
      }
    }
    for (i = this.props.layers.length - 1; i >= 0; i--) {
      const layer = this.props.layers[i];
      if (!layersHash[layer.id] && (!layer.metadata || layer.metadata[LAYERLIST_HIDE_KEY] !== true)) {
        layers.push(<this.layerClass key={i} layers={this.props.layers} layer={layer} />);
      }
    }
    return (
      <ul style={this.props.style} className={className}>
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
  style: PropTypes.object,
  className: PropTypes.string,
};

SdkLayerList.defaultProps = {
  layerClass: SdkLayerListItem,
};

function mapStateToProps(state) {
  return {
    layers: state.map.layers,
    metadata: state.map.metadata,
  };
}

export default connect(mapStateToProps)(SdkLayerList);
