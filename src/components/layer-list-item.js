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
import PropTypes from 'prop-types';
import {DragSource, DropTarget} from 'react-dnd';
import {getLayerIndexById, isLayerVisible, getLayerTitle} from '../util';
import * as mapActions from '../actions/map';

export const layerListItemSource = {
  beginDrag(props) {
    return {
      index: props.index,
      layer: props.layer,
    };
  }
};

export const layerListItemTarget = {
  drop(props, monitor, component) {
    var sourceItem = monitor.getItem();
    const dragIndex = sourceItem.index;
    const hoverIndex = props.index;
    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }
    // Time to actually perform the action
    const target = props.layers[hoverIndex];
    if (target && sourceItem.layer && sourceItem.layer.id !== target.id) {
      props.dispatch(mapActions.orderLayer(sourceItem.layer.id, target.id));
    }
  }
};

export function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
  };
}

export function collectDrop(connect, monitor) {
  return {
    isOver: monitor.isOver({shallow: true}),
    connectDropTarget: connect.dropTarget()
  };
}

/** @module components/layer-list-item
 *
 * @desc Provides a layer list item, with a radio button or checkbox for visibility control.
 */
export default class SdkLayerListItem extends React.Component {
  moveLayer(layerId, targetId) {
    this.props.dispatch(mapActions.orderLayer(layerId, targetId));
  }
  moveLayerUp() {
    const layer_id = this.props.layer.id;
    const index = getLayerIndexById(this.props.layers, layer_id);
    if (index < this.props.layers.length - 1) {
      this.moveLayer(layer_id, this.props.layers[index + 1].id);
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
          onChange={() => {
            this.toggleVisibility();
          }}
          checked={is_checked}
        />
      );
    } else {
      return (
        <input
          type="checkbox"
          onChange={() => {
            this.toggleVisibility();
          }}
          checked={is_checked}
        />
      );
    }
  }
  render() {
    const layer = this.props.layer;
    const checkbox = this.getVisibilityControl();
    const error_class = this.props.error ? ' sdk-layer-error' : '';
    const markup = (
      <li className={`sdk-layer${error_class}`} key={layer.id}>
        <span className="sdk-checkbox">{checkbox}</span>
        <span className="sdk-name">{getLayerTitle(this.props.layer)}</span>
      </li>
    );
    if (this.props.enableDD) {
      return this.props.connectDragSource(this.props.connectDropTarget(markup));
    } else {
      return markup;
    }
  }
}

SdkLayerListItem.propTypes = {
  /**
   * Should we enable drag and drop?
   */
  enableDD: PropTypes.bool,
  /**
   * Set of layers which belong to the same group
   */
  groupLayers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })),
  /**
   * Set of all layers in the map.
   */
  layers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
  /**
   * Does this layer belong to an exclusive group? If so render as a radio button group.
   */
  exclusive: PropTypes.bool,
  /**
   * Identifier of the group to which this layer belongs.
   */
  groupId: PropTypes.string,
  /**
   * The layer to use for this item.
   */
  layer: PropTypes.shape({
    /**
     * Identifier of the layer.
     */
    id: PropTypes.string,
  }).isRequired,
  /**
   * If the layer's source has an error, display
   *  the layer as "errored".
   */
  error: PropTypes.bool,
};

SdkLayerListItem.defaultProps = {
  error: false,
};

export const types = 'layerlistitem';
export const SdkLayerListItemDD = DropTarget(types, layerListItemTarget, collectDrop)(DragSource(types, layerListItemSource, collect)(SdkLayerListItem));
