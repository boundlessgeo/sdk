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

import {MAP} from '../action-types';
import {TITLE_KEY, TIME_KEY} from '../constants';
import {encodeQueryObject} from '../util';

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
    view: {center, zoom},
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
 *  @param {number} bearing Bearing value to set in degrees.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setBearing(bearing) {
  return {
    type: MAP.SET_BEARING,
    bearing,
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
  if (sourceTypes.indexOf(sourceDef.type) === -1) {
    throw (new Error('Invalid source type: ' + sourceDef.type + '.  Valid source types are ' + sourceTypes.toString()));
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

/** Action to clear an existing filter on a layer.
 *  @param {string} layerId String id for the layer for which the filter is to be cleared.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function clearLayerFilter(layerId) {
  return {
    type: MAP.CLEAR_LAYER_FILTER,
    layerId,
  };
}

/** Action to update cluster status in the map state.
 *  @param {string} sourceName Name of the source to be added.
 *  @param {boolean} isClustered Is the source clustered?
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
 *  @param {number} position The position at which to add the features.
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
 *  @param {boolean} visibility Should the layer be visible?
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

/** Set the glyphs for the map.
 *
 *  @param {string} glyphs The URL template for the glyphs sets.
 *
 *  @returns {Object} An action object.
 */
export function setGlyphs(glyphs) {
  return {
    type: MAP.SET_GLYPHS,
    glyphs,
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

/** Create an action for moving a group
 *
 *  @param {string} group Group name.
 *  @param {string} layerId Layer id of the new place for the layer.
 *
 *  @returns {object} An action object.
 */
export function moveGroup(group, layerId) {
  return {
    type: MAP.MOVE_GROUP,
    placeAt: layerId,
    group,
  };
}

/** Add a WMS source.
 *
 * @param {string} sourceId - new ID for the source.
 * @param {string} serverUrl - URL for the service.
 * @param {string} layerName - WFS feature type.
 * @param {Object} options - Optional settings. Honors: accessToken, projection, asVector, tileSize
 *
 * @returns {Object} Action to create a new source.
 */
export function addWmsSource(sourceId, serverUrl, layerName, options = {}) {
  const tile_size = options.tileSize ? options.tileSize : 256;
  const projection = options.projection ? options.projection : 'EPSG:3857';
  // default behaviour is vector
  const format = (options.asVector !== false) ? 'application/x-protobuf;type=mapbox-vector' : 'image/png';

  const params = {
    'SERVICE': 'WMS',
    'VERSION': '1.3.0',
    'REQUEST': 'GetMap',
    'FORMAT': format,
    'TRANSPARENT': 'TRUE',
    'LAYERS': layerName,
    'WIDTH': tile_size,
    'HEIGHT': tile_size,
    'CRS': projection,
  };

  if (options.accessToken) {
    params['ACCESS_TOKEN'] = options.accessToken;
  }

  // the BBOX is not escaped because the "{" and "}" are used for string
  // substitution in the library.
  const url_template = `${serverUrl}?${encodeQueryObject(params)}&BBOX={bbox-epsg-3857}`;

  if (options.asVector !== false) {
    return addSource(sourceId, {
      type: 'vector',
      url: url_template,
    });
  } else {
    return addSource(sourceId, {
      type: 'raster',
      tileSize: tile_size,
      tiles: [
        url_template,
      ],
    });
  }
}

/** Add a WFS / GeoJSON source.
 *
 * @param {string} sourceId - new ID for the source.
 * @param {string} serverUrl - URL for the service.
 * @param {string} featureType - WFS feature type.
 * @param {Object} options - Optional settings. Honors: accessToken
 *
 * @returns {Object} Action to create a new source.
 */
export function addWfsSource(sourceId, serverUrl, featureType, options = {}) {
  const params = {
    'SERVICE': 'WFS',
    'VERSION': '1.1.0',
    // projection is always fixed for WFS sources as they
    // are reprojected on the client.
    'SRSNAME': 'EPSG:4326',
    'REQUEST': 'GetFeature',
    'TYPENAME': featureType,
    'OUTPUTFORMAT': 'JSON',
  };

  if (options.accessToken) {
    params['ACCESS_TOKEN'] = options.accessToken;
  }

  return addSource(sourceId, {
    type: 'geojson',
    data: `${serverUrl}?${encodeQueryObject(params)}`,
    requestHeaders: options.requestHeaders
  });
}

/** Add a Mapbox Vector Tile layer from a TMS service.
 *
 * @param {string} sourceId - new ID for the source.
 * @param {string} serverUrl - URL for the service.
 * @param {string} layerName - Name of the layer.
 * @param {Object} options - Optional settings. Honors: accessToken
 *
 * @returns {Object} Action to create a new source.
 */
export function addTmsSource(sourceId, serverUrl, layerName, options = {}) {
  const token_string = options.accessToken ? `access_token=${options.accessToken}` : '';

  const url = `${serverUrl}/gwc/service/tms/1.0.0/${layerName}@EPSG%3A3857@pbf/{z}/{x}/{-y}.pbf?${token_string}`;

  return addSource(sourceId, {
    type: 'vector',
    url,
  });
}

/** Add an OSM raster tile source
 *
 * @param {string} sourceId - new ID for the source.
 *
 * @returns {Object} Action to create a new source.
 */
export function addOsmSource(sourceId) {
  return addSource(sourceId, {
    type: 'raster',
    tileSize: 256,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
  });
}
