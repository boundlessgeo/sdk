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
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {LAYERLIST_HIDE_KEY, GROUP_KEY, GROUPS_KEY} from '../constants';
import {getLayerIndexById, hasSourceError} from '../util';
import {SdkLayerListItemDD} from './layer-list-item';

export class SdkList extends React.Component {
  render() {
    return (
      <ul style={this.props.style} className={this.props.className}>
        {this.props.children}
      </ul>
    );
  }
}

SdkList.propTypes = {
  style: PropTypes.object,
  className: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export class SdkLayerListGroup extends React.Component {

  render() {
    const children = [];
    for (let i = 0, ii = this.props.childLayers.length; i < ii; i++) {
      children.push(
        <this.props.layerClass
          enableDD={this.props.enableDD}
          exclusive={this.props.group.exclusive}
          key={i}
          index={getLayerIndexById(this.props.layers, this.props.childLayers[i].id)}
          groupLayers={this.props.childLayers}
          layers={this.props.layers}
          layer={this.props.childLayers[i]}
          groupId={this.props.groupId}
          error={this.props.error}
        />
      );
    }

    const errors = this.props.error ? ' sdk-layer-error' : '';

    return (<li className={`sdk-layer-group${errors}`}>{this.props.group.name}<ul>{children}</ul></li>);
  }
}

SdkLayerListGroup.propTypes = {
  enableDD: PropTypes.bool,
  groupId: PropTypes.string.isRequired,
  group: PropTypes.shape({
    name: PropTypes.string,
    exclusive: PropTypes.bool,
  }).isRequired,
  layerClass: PropTypes.func.isRequired,
  childLayers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
  layers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
};

/** @module components/layer-list
 *
 * @desc Provides a layer list control.
 */
class SdkLayerList extends React.Component {
  constructor(props) {
    super(props);

    this.groupClass = connect()(this.props.groupClass);
    this.layerClass = connect()(this.props.layerClass);
  }

  addGroup(layers, groupName, groups, group_layers) {
    // show an error if any of the layers in the group have an error.
    let has_error = false;
    for (let i = 0, ii = group_layers.length; i < ii; i++) {
      has_error = has_error || hasSourceError(group_layers[i], this.props.sourceErrors);
    }

    const group_props = Object.assign({}, this.props.groupProps, {
      enableDD: this.props.enableDD,
      key: groupName,
      groupId: groupName,
      group: groups[groupName],
      childLayers: group_layers,
      layers: this.props.layers,
      layerClass: this.layerClass,
      error: has_error,
    });

    layers.unshift(<this.groupClass {...group_props} />);
  }

  handlePendingGroup(layers, group_layers, groupName, groups) {
    if (group_layers && group_layers.length) {
      this.addGroup(layers, groupName, groups, group_layers);
      // reset group_layers
      group_layers = [];
    }
    return group_layers;
  }

  render() {
    let className = 'sdk-layer-list';
    if (this.props.className) {
      className = `${className} ${this.props.className}`;
    }
    const layers = [];
    const groups = this.props.metadata ? this.props.metadata[GROUPS_KEY] : undefined;
    let groupName, group_layers;
    for (let i = 0, ii = this.props.layers.length; i < ii; i++) {
      const item = this.props.layers[i];
      if (item.metadata && item.metadata[GROUP_KEY]) {
        if (groupName !== item.metadata[GROUP_KEY]) {
          if (group_layers && group_layers.length > 0) {
            this.addGroup(layers, groupName, groups, group_layers);
          }
          group_layers = [];
        }
        groupName = item.metadata[GROUP_KEY];
        if (group_layers && item.metadata[LAYERLIST_HIDE_KEY] !== true) {
          group_layers.unshift(item);
        }
      } else if (!item.metadata || item.metadata[LAYERLIST_HIDE_KEY] !== true) {
        group_layers = this.handlePendingGroup(layers, group_layers, groupName, groups);
        layers.unshift(
          <this.layerClass
            enableDD={this.props.enableDD}
            index={i}
            key={i}
            layers={this.props.layers}
            layer={item}
            error={hasSourceError(item, this.props.sourceErrors)}
          />
        );
      }
    }
    this.handlePendingGroup(layers, group_layers, groupName, groups);
    return (
      <this.props.listClass style={this.props.style} className={className}>
        { layers }
      </this.props.listClass>
    );
  }
}

SdkLayerList.propTypes = {
  /**
   * Should we enable drag and drop for reordering?
   */
  enableDD: PropTypes.bool,
  /**
   * React.Component to use for rendering layer groups.
   */
  groupClass: PropTypes.func,
  /**
   * React.Component to use for rendering layers.
   */
  layerClass: PropTypes.func,
  /**
   * React.Component to use for rendering lists. The default implementation uses <ul>.
   */
  listClass: PropTypes.func,
  /**
   * List of layers to use.
   */
  layers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
  /**
   * Style config object for the root element.
   */
  style: PropTypes.object,
  /**
   * Css className for the root element.
   */
  className: PropTypes.string,
  /**
   * Additional props for Groups in the list
   */
  groupProps: PropTypes.object,
};

SdkLayerList.defaultProps = {
  enableDD: true,
  layerClass: SdkLayerListItemDD,
  groupClass: SdkLayerListGroup,
  listClass: SdkList,
  groupProps: {},
};

function mapStateToProps(state) {
  return {
    layers: state.map.layers,
    metadata: state.map.metadata,
    sourceErrors: state.mapinfo ? state.mapinfo.sourceErrors : {},
  };
}

export default connect(mapStateToProps)(SdkLayerList);
