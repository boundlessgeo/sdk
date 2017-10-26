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

import fetch from 'isomorphic-fetch';

/** @module actions/map
 * @desc Action Defintions for the map.
 */

import { MAP } from '../action-types';
import { TITLE_KEY, TIME_KEY } from '../constants';

const sourceTypes = [
  'vector',
  'raster',
  'geojson',
  'image',
  'video',
  'canvas'
];

/** Action to update the center and zoom values in map state.
 *  @param {number[]} center Center coordinates.
 *  @param {number} zoom Zoom value.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setView(center, zoom) {
  return {
    type: MAP.SET_VIEW,
    view: { center, zoom },
  };
}

/** Action to zoom in on the map.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function zoomIn() {
  return {
    type: MAP.ZOOM_IN,
  };
}

/** Action to zoom out on the map.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function zoomOut() {
  return {
    type: MAP.ZOOM_OUT,
  };
}

/** Action to set the zoom level.
 *  @param {number} zoom Zoom value.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setZoom(zoom) {
  return {
    type: MAP.SET_ZOOM,
    zoom,
  };
}

/** Action to update the map name in map state.
 *  @param {string} name Map name.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setMapName(name) {
  return {
    type: MAP.SET_NAME,
    name,
  };
}

/** Action to update the map bearing value in map state.
 *  @param {number} degrees Bearing value to set in degrees.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setRotation(degrees) {
  return {
    type: MAP.SET_ROTATION,
    degrees,
  };
}

/** Action to add a layer object in the map state.
 *  @param {Object} layerDef Layer properties.
 *  @param {string} layerTitle Title of the layer to be added.
 *  @param {string} positionId String id for the layer.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function addLayer(layerDef, layerTitle, positionId) {
  return {
    type: MAP.ADD_LAYER,
    layerDef,
    layerTitle,
    positionId,
  };
}

/** Action to add a source object in the map state.
 *  @param {string} sourceName Name of the source to be added.
 *  @param {Object} sourceDef Source properties.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function addSource(sourceName, sourceDef) {
  if (sourceTypes.indexOf(sourceDef.type) === -1 ) {
    throw(new Error("Invalid source type: " + sourceDef.type + ".  Valid source types are " + sourceTypes.toString()));
  }
  return {
    type: MAP.ADD_SOURCE,
    sourceName,
    sourceDef,
  };
}

/** Action to remove a layer object in the map state.
 *  @param {string} layerId String id for the layer.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function removeLayer(layerId) {
  return {
    type: MAP.REMOVE_LAYER,
    layerId,
  };
}

/** Action to remove a source object in the map state.
 *  @param {string} sourceName Name of the source to be added.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function removeSource(sourceName) {
  return {
    type: MAP.REMOVE_SOURCE,
    sourceName,
  };
}

/** Action to update a layer object in the map state.
 *  @param {string} layerId String id for the layer to be updated.
 *  @param {Object} layerDef Layer properties.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function updateLayer(layerId, layerDef) {
  return {
    type: MAP.UPDATE_LAYER,
    layerId,
    layerDef,
  };
}

/** Action to update cluster status in the map state.
 *  @param {string} sourceName Name of the source to be added.
 *  @param {boolean} isClustered
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function clusterPoints(sourceName, isClustered) {
  return {
    type: MAP.CLUSTER_POINTS,
    sourceName,
    cluster: isClustered,
  };
}

/** Set the radius of a clustering layer.
 *
 *  When set to a layer without clustering this will
 *  have no effect.
 *
 *  @param {Object} sourceName Name of the source on which the features are clustered.
 *  @param {number} radius Cluster radius.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setClusterRadius(sourceName, radius) {
  return {
    type: MAP.SET_CLUSTER_RADIUS,
    sourceName,
    radius,
  };
}

/** Add features to a source on the map.
 *
 *  @param {Object} sourceName Name of the source on which the features will be added.
 *  @param {Object[]} features An array of features to add.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function addFeatures(sourceName, features, position = -1) {
  return {
    type: MAP.ADD_FEATURES,
    sourceName,
    features,
    position,
  };
}

/** Remove features from a source on the map.
 *
 *  @param {Object} sourceName Name of the source on which the features will be removed.
 *  @param {string[]} filter Rule determining which features will be removed.
 *  See https://www.mapbox.com/mapbox-gl-js/style-spec/#types-filter.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function removeFeatures(sourceName, filter) {
  return {
    type: MAP.REMOVE_FEATURES,
    sourceName,
    filter,
  };
}

/** Change the visibility of a given layer in the map state.
 *
 *  @param {string} layerId String id for the layer.
 *  @param {boolean} visibility
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setLayerVisibility(layerId, visibility) {
  return {
    type: MAP.SET_LAYER_VISIBILITY,
    layerId,
    visibility,
  };
}

/** Set a layer visible in a mutually exclusive group.
 *
 *  @param {string} layerId String id for the layer to turn on.
 *  @param {string} groupId String id for the layer group.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setLayerInGroupVisible(layerId, groupId) {
  return {
    type: MAP.SET_LAYER_IN_GROUP_VISIBLE,
    layerId,
    groupId,
  };
}

/** Change the metadata object in a given layer in the map state.
 *
 *  @param {string} layerId String id for the layer.
 *  @param {string} itemName A key.
 *  @param {number} itemValue A value.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setLayerMetadata(layerId, itemName, itemValue) {
  return {
    type: MAP.SET_LAYER_METADATA,
    layerId,
    key: itemName,
    value: itemValue,
  };
}

/** Set a layer's title in the map state.
 *
 *  @param {string} layerId String id for the layer.
 *  @param {string} title A string representing a layer title.
 *
 *  @returns {Object} Call to setLayerMetadata for a title key.
 */
export function setLayerTitle(layerId, title) {
  return setLayerMetadata(layerId, TITLE_KEY, title);
}

/** Set a layer's time property in the map state.
 *
 *  @param {string} layerId String id for the layer.
 *  @param {*} time The value of time assigned to the layer.
 *
 *  @returns {Object} Call to setLayerMetadata for a time key.
 */
export function setLayerTime(layerId, time) {
  return setLayerMetadata(layerId, TIME_KEY, time);
}

/** Receive a Mapbox GL style object.
 *
 *  @param {Object} context Mapbox GL style object to populate the map state.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function receiveContext(context) {
  return {
    type: MAP.RECEIVE_CONTEXT,
    context,
  };
}

/** Thunk action creator to set the map state from a provided context object.
 *
 *  @param {Object} options A context object that must provide a Mapbox GL json
 *  object either via a json property or a from a url fetch.
 *
 *  @returns {Promise} A Promise object.
 */
export function setContext(options) {
  return (dispatch) => {
    if (options.url) {
      return fetch(options.url)
        .then(
          response => response.json(),
          error => console.error('An error occured.', error),
        )
        .then(json =>
          dispatch(receiveContext(json)),
        );
    } else if (options.json) {
      return new Promise((resolve) => {
        dispatch(receiveContext(options.json));
        resolve();
      });
    }
    return new Promise((resolve, reject) => {
      reject('Invalid option for setContext. Specify either json or url.');
    });
  };
}

/** Rearrange a layer in the list.
 *
 *  @param {string} layerId the layer to move.
 *  @param {string} targetLayerId The ID of the layer to move the layerId BEFORE.
 *                       When null or undefined, moves the layer to the end
 *                       of the list.
 *
 *  @returns {Object} An action object.
 */
export function orderLayer(layerId, targetLayerId) {
  return {
    type: MAP.ORDER_LAYER,
    layerId,
    targetId: targetLayerId,
  };
}

/** Set the sprite for the map.
 *
 *  @param {string} spriteRoot The URI to the sprite data without the .json/.png suffix.
 *
 *  @returns {Object} An action object.
 */
export function setSprite(spriteRoot) {
  return {
    type: MAP.SET_SPRITE,
    sprite: spriteRoot,
  };
}

/** Update the map's metadata.
 *
 *  @param {Object} metadata An object containing new/updated metadata.
 *
 *  @returns {Object} An action object.
 */
export function updateMetadata(metadata) {
  return {
    type: MAP.UPDATE_METADATA,
    metadata,
  };
}

/** Manually update a source.
 *
 *  @param {string} sourceName The name of the source to be updated.
 *  @param {Object} update The changes to the sourceDef to apply.
 *
 *  @returns {Object} An action object to pass to the reducer
 */
export function updateSource(sourceName, update) {
  return {
    type: MAP.UPDATE_SOURCE,
    sourceName,
    sourceDef: update,
  };
}

/** Set the time of the map.
 *
 *  @param {string} time An ISO date time string.
 *
 *  @returns {Object} An action object.
 */
export function setMapTime(time) {
  let metadata = {};
  metadata[TIME_KEY] = time;
  return updateMetadata(metadata);
}
