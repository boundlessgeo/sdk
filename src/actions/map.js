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

/** Action Defintions for the map.
 */

import { MAP } from '../action-types';
import { TITLE_KEY } from '../constants';

export function setView(center, zoom) {
  return {
    type: MAP.SET_VIEW,
    view: { center, zoom },
  };
}

export function setMapName(name) {
  return {
    type: MAP.SET_NAME,
    name,
  };
}

export function setRotation(degrees) {
  return {
    type: MAP.SET_ROTATION,
    degrees,
  };
}

export function addLayer(layerDef, layerTitle, positionId) {
  return {
    type: MAP.ADD_LAYER,
    layerDef,
    layerTitle,
    positionId,
  };
}

export function addSource(sourceName, sourceDef) {
  return {
    type: MAP.ADD_SOURCE,
    sourceName,
    sourceDef,
  };
}

export function removeLayer(layerId) {
  return {
    type: MAP.REMOVE_LAYER,
    layerId,
  };
}

export function removeSource(sourceName) {
  return {
    type: MAP.REMOVE_SOURCE,
    sourceName,
  };
}

export function updateLayer(layerId, layerDef) {
  return {
    type: MAP.UPDATE_LAYER,
    layerId,
    layerDef,
  };
}

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
 */
export function setClusterRadius(sourceName, radius) {
  return {
    type: MAP.SET_CLUSTER_RADIUS,
    sourceName,
    radius,
  };
}

export function addFeatures(sourceName, features) {
  return {
    type: MAP.ADD_FEATURES,
    sourceName,
    features,
  };
}

export function removeFeatures(sourceName, filter) {
  return {
    type: MAP.REMOVE_FEATURES,
    sourceName,
    filter,
  };
}

export function setLayerVisibility(layerId, visibility) {
  return {
    type: MAP.SET_LAYER_VISIBILITY,
    layerId,
    visibility,
  };
}

export function setLayerMetadata(layerId, itemName, itemValue) {
  return {
    type: MAP.SET_LAYER_METADATA,
    layerId,
    key: itemName,
    value: itemValue,
  };
}

export function setLayerTitle(layerId, title) {
  return setLayerMetadata(layerId, TITLE_KEY, title);
}

export function receiveContext(context) {
  return {
    type: MAP.RECEIVE_CONTEXT,
    context,
  };
}

// thunk action creator
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
 *  @param layerId the layer to move.
 *  @param targetLayerId The ID of the layer id to move the layerId BEFORE.
 *                       When null or undefined, moves the layer to the end
 *                       of the list.
 *
 * @returns action object.
 */
export function orderLayer(layerId, targetLayerId) {
  return {
    type: MAP.ORDER_LAYER,
    layerId,
    targetId: targetLayerId,
  };
}

/** Set the sprite for the map
 *
 *  @param spriteRoot - The URI to the sprite data without the .json/.png suffix.
 *
 * @returns action object.
 */
export function setSprite(spriteRoot) {
  return {
    type: MAP.SET_SPRITE,
    sprite: spriteRoot,
  };
}

/** Update the map's metadata.
 *
 *  @param metadata - An object containing new/updated metadata.
 *
 * @returns action object.
 */
export function updateMetadata(metadata) {
  return {
    type: MAP.UPDATE_METADATA,
    metadata,
  };
}
