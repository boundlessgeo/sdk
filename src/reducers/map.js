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

/** @module reducers/map
 * @desc Reducer to implement mapbox style document.
 */

import createFilter from '@mapbox/mapbox-gl-style-spec/feature_filter';
import {getGroup, getLayerIndexById, reprojectGeoJson, getResolutionForExtent, getZoomForResolution} from '../util';
import {MAP} from '../action-types';
import {DEFAULT_ZOOM, LAYER_VERSION_KEY, SOURCE_VERSION_KEY, TITLE_KEY, DATA_VERSION_KEY, GROUP_KEY, GROUPS_KEY} from '../constants';

function defaultMetadata() {
  // define the metadata.
  const default_metadata = {};
  default_metadata[LAYER_VERSION_KEY] = 0;
  default_metadata[SOURCE_VERSION_KEY] = 0;
  return default_metadata;
}

const defaultState = {
  version: 8,
  name: 'default',
  center: [0, 0],
  zoom: 3,
  bearing: 0,
  metadata: defaultMetadata(),
  sources: {},
  layers: [],
};

/** Returns a metadata child object.
 *
 *  @param {Object} metadata The state.map.metadata.
 *  @param {string} version The version name of the metadata child object to be returned.
 *
 *  @returns {Object} The requested metadata child object.
 */
function getVersion(metadata, version) {
  if (typeof (metadata) === 'undefined' || typeof (metadata[version]) === 'undefined') {
    return 0;
  }
  return metadata[version];
}

/** Increments metadata object version numbers.
 *
 *  @param {Object} metadata The state.map.metadata.
 *  @param {string} version The metadata object to be incremented.
 *
 *  @returns {Object} The new state.map.metadata object with the incremented version.
 */
function incrementVersion(metadata, version) {
  const new_metadata = Object.assign({}, metadata);
  new_metadata[version] = getVersion(metadata, version) + 1;
  return {
    metadata: new_metadata,
  };
}

/** As there is no "source" metadata, this generates a unique key
 *  for the version of the data in the map's metadata object.
 *
 *  @param {string} sourceName The name of the source whose data is versioned.
 *
 *  @returns {string} The string value of the new source data version key.
 */
export function dataVersionKey(sourceName) {
  return `${DATA_VERSION_KEY}:${sourceName}`;
}

/** Move a layer in the layers list.
 *
 *  @param {Object} state The redux state.
 *  @param {Object} layer The layer object to be moved.
 *  @param {string} targetId The id of the layer
 *  at the position where layer will be moved.
 *
 *  @returns {Object} The new state object.
 */
function placeLayer(state, layer, targetId) {
  const new_layers = state.layers.slice();
  const idx1 = getLayerIndexById(new_layers, layer.id);
  const idx2 = getLayerIndexById(new_layers, targetId);
  if (idx1 !== -1) {
    new_layers.splice(idx1, 1);
  }
  const newIndex = targetId ? idx2 : new_layers.length;
  new_layers.splice(newIndex, 0, layer);
  return Object.assign({}, state, {
    layers: new_layers,
  }, incrementVersion(state.metadata, LAYER_VERSION_KEY));
}

/** Change the target for reodering of layers. This makes sure that groups
 *  stay together in the layer stack. Layers of a group cannot move outside of
 *  the group.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {string|boolean} The new targetId or false if moving should be blocked.
 */
function changeTarget(state, action) {
  const layerIdx = getLayerIndexById(state.layers, action.layerId);
  const layer = state.layers[layerIdx];
  const layerGroup = getGroup(layer);
  const targetIdx = getLayerIndexById(state.layers, action.targetId);
  if (layerGroup) {
    return false;
  }
  let i, ii;
  if (layerIdx < targetIdx) {
    // move up
    for (i = targetIdx + 1, ii = state.layers.length; i < ii; i++) {
      if (getGroup(state.layers[i]) === layerGroup) {
        return state.layers[i - 1].id;
      }
    }
    return state.layers[ii - 1].id;
  } else {
    // move down
    for (i = targetIdx - 1; i >= 0; i--) {
      if (getGroup(state.layers[i]) === layerGroup) {
        return state.layers[i + 1].id;
      }
    }
    return state.layers[0].id;
  }
}

/** Change the order of the layer in the stack.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function orderLayer(state, action) {
  let layer = null, target = null;
  for (let i = 0, ii = state.layers.length; i < ii; i++) {
    if (state.layers[i].id === action.layerId) {
      layer = state.layers[i];
    }
    if (state.layers[i].id === action.targetId) {
      target = state.layers[i];
    }
  }

  if (layer !== null) {
    let targetId = action.targetId;
    let targetGroup = getGroup(target);
    let layerGroup = getGroup(layer);
    if (layerGroup !== targetGroup) {
      targetId = changeTarget(state, action);
    }
    if (targetId !== false) {
      return placeLayer(state, layer, targetId);
    }
  }
  return state;
}

/** Move a group relative to another group.
 *
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function moveGroup(state, action) {
  const place_at = getLayerIndexById(state.layers, action.placeAt);
  const n_layers = state.layers.length;

  // sanity check the new index.
  if (place_at < 0 || place_at > n_layers) {
    return state;
  }

  // find the starting and ending points of the group
  let group_start = null;
  let group_end = null;
  for (let i = 0, ii = n_layers; i < ii; i++) {
    const group = getGroup(state.layers[i]);
    if (group === action.group) {
      if (group_start === null || i < group_start) {
        group_start = i;
      }
      if (group_end === null || i > group_end) {
        group_end = i;
      }
    }
  }


  // get the real index of the next spot for the group,
  // if the placeAt index is mid group then place_at should
  // be the index of the FIRST member of that group.
  let place_start = place_at;
  const place_group = getGroup(state.layers[place_at]);
  const place_ahead = (place_at > group_start);

  // when placing a group before or after another group
  // the bounds of the target group needs to be found and the
  // appropriate index chosen based on the direction of placement.
  if (place_group) {
    let new_place = -1;
    if (place_ahead) {
      for (let i = n_layers - 1; i >= 0 && new_place < 0; i--) {
        if (getGroup(state.layers[i]) === place_group) {
          new_place = i;
        }
      }
    } else {
      for (let i = 0, ii = n_layers; i < ii && new_place < 0; i++) {
        if (getGroup(state.layers[i]) === place_group) {
          new_place = i;
        }
      }
    }
    place_start = new_place;
  }

  // build a new array for the layers.
  let new_layers = [];

  // have the group layers ready to concat.
  const group_layers = state.layers.slice(group_start, group_end + 1);

  for (let i = 0, ii = n_layers; i < ii; i++) {
    const layer = state.layers[i];
    const in_group = (getGroup(layer) === action.group);

    if (place_ahead && !in_group) {
      new_layers.push(layer);
    }
    if (i === place_start) {
      new_layers = new_layers.concat(group_layers);
    }
    if (!place_ahead && !in_group) {
      new_layers.push(layer);
    }
  }

  return Object.assign({}, state, {
    layers: new_layers,
  }, incrementVersion(state.metadata, LAYER_VERSION_KEY));
}

/** Add a layer to the state.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function addLayer(state, action) {
  // TODO: Maybe decide on what a "default case" is in
  //       order to support easier dev.
  const new_layer = Object.assign({
    paint: {},
    metadata: {},
  }, action.layerDef);

  // add a layer name if specified in the action.
  if (action.layerTitle) {
    new_layer.metadata[TITLE_KEY] = action.layerTitle;
  }

  return placeLayer(state, new_layer, action.positionId);
}

/** Remove a layer from the state.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function removeLayer(state, action) {
  const new_layers = [];
  for (let i = 0, ii = state.layers.length; i < ii; i++) {
    if (state.layers[i].id !== action.layerId) {
      new_layers.push(state.layers[i]);
    }
  }

  return Object.assign({}, state, {
    layers: new_layers,
  }, incrementVersion(state.metadata, LAYER_VERSION_KEY));
}

/** Clear an existing layer filter.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function clearLayerFilter(state, action) {
  const new_layers = [];
  for (let i = 0, ii = state.layers.length; i < ii; i++) {
    if (state.layers[i].id === action.layerId) {
      const newProps = Object.assign({}, state.layers[i]);
      delete newProps.filter;
      new_layers.push(newProps);
    } else {
      new_layers.push(state.layers[i]);
    }
  }
  return Object.assign({}, state, {
    layers: new_layers,
  }, incrementVersion(state.metadata, LAYER_VERSION_KEY));
}

/** Update a layer that's in the state already.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function updateLayer(state, action) {
  // action.layer should be a new mix in for the layer.
  const new_layers = [];
  for (let i = 0, ii = state.layers.length; i < ii; i++) {
    // if the id matches, update the layer
    if (state.layers[i].id === action.layerId) {
      if (action.type === MAP.SET_LAYER_METADATA) {
        const meta_update = {};
        meta_update[action.key] = action.value;
        new_layers.push(Object.assign({}, state.layers[i], {
          metadata: Object.assign({}, state.layers[i].metadata, meta_update),
        }));
      } else {
        new_layers.push(Object.assign({}, state.layers[i], action.layerDef));
      }
    // otherwise leave it the same.
    } else {
      new_layers.push(state.layers[i]);
    }
  }

  return Object.assign({}, state, {
    layers: new_layers,
  }, incrementVersion(state.metadata, LAYER_VERSION_KEY));
}

/** Add a source to the state.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function addSource(state, action) {
  const new_source = {};

  new_source[action.sourceName] = Object.assign({}, action.sourceDef);
  if (action.sourceDef.type === 'geojson') {
    if (action.sourceDef.data === undefined || action.sourceDef.data === null) {
      new_source[action.sourceName].data = {};
    } else if (typeof action.sourceDef.data === 'object') {
      new_source[action.sourceName].data = Object.assign({}, action.sourceDef.data);
    } else {
      new_source[action.sourceName].data = action.sourceDef.data;
    }
  }

  const new_metadata = {};
  new_metadata[dataVersionKey(action.sourceName)] = 0;

  const new_sources = Object.assign({}, state.sources, new_source);
  return Object.assign({}, state, {
    metadata: Object.assign({}, state.metadata, new_metadata),
    sources: new_sources,
  }, incrementVersion(state.metadata, SOURCE_VERSION_KEY));

}

/** Remove a source from the state.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function removeSource(state, action) {
  const new_sources = Object.assign({}, state.sources);
  delete new_sources[action.sourceName];
  return Object.assign({}, state, {
    sources: new_sources,
  }, incrementVersion(state.metadata, SOURCE_VERSION_KEY));
}

/** Creates a new state with the data for a
 *  source changed to the contents of data.
 *
 *  @param {Object} state The redux state.
 *  @param {string} sourceName The name of the source to be changed.
 *  @param {Object[]} data The list of features to be added to the source.
 *
 *  @returns {Object} The new redux state.
 */
function changeData(state, sourceName, data) {
  const source = state.sources[sourceName];
  if (!source) {
    return state;
  }
  const src_mixin = {};

  // update the individual source.
  src_mixin[sourceName] = Object.assign({}, source, {
    data,
  });

  // kick back the new state.
  return Object.assign({}, state, {
    sources: Object.assign({}, state.sources, src_mixin),
  }, incrementVersion(state.metadata, dataVersionKey(sourceName)));
}

/** Add features to a source.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function addFeatures(state, action) {
  const source = state.sources[action.sourceName];
  if (!source) {
    return state;
  }
  const data = source.data;

  // placeholder for the new data
  let new_data = null;
  let features;
  if (action.features.features) {
    // When a full geoJson object is passed in, check the projection
    features = reprojectGeoJson(action.features);
  } else {
    // Pass along an just features
    features = action.features;
  }

  // when there is no data, use the data
  // from the action.
  if (!data || !data.type) {
    // coerce this to a FeatureCollection.
    new_data = {
      type: 'FeatureCollection',
      features,
    };
  } else if (data.type === 'Feature') {
    new_data = {
      type: 'FeatureCollection',
      features: [data].concat(features),
    };
  } else if (data.type === 'FeatureCollection') {
    let featureCollection = [];

    if (action.position > -1) {
      for (let i = 0, ii = data.features.length; i < ii; i++) {
        if (i === action.position) {
          for (let x = 0, xx = features.length; x < xx; x++) {
            featureCollection.push(features[x]);
          }
        }
        featureCollection.push(data.features[i]);
      }
    } else {
      featureCollection = data.features.concat(features);
    }
    new_data = Object.assign({}, data, {features: featureCollection});
  }

  if (new_data !== null) {
    return changeData(state, action.sourceName, new_data);
  }
  return state;
}

/** Cluster points.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function clusterPoints(state, action) {
  const source = state.sources[action.sourceName];
  if (!source) {
    return state;
  }
  const src_mixin = [];
  const cluster_settings = {};

  if (typeof action.cluster !== 'undefined') {
    cluster_settings.cluster = action.cluster;
    // Mapbox GL style spec defaults to 50,
    //  whereas OpenLayers defaults to 20px.
    cluster_settings.clusterRadius = source.clusterRadius ? source.clusterRadius : 50;
  }

  // The radius can be overridden at any time.
  if (typeof action.radius !== 'undefined') {
    cluster_settings.clusterRadius = action.radius;
  }
  src_mixin[action.sourceName] = Object.assign({}, source, cluster_settings);

  const newState = Object.assign({}, state, {
    sources: Object.assign({}, state.sources, src_mixin),
  }, incrementVersion(state.metadata, SOURCE_VERSION_KEY));
  return newState;
}

/** Remove features from a source.
 *  The action should define a filter, any feature
 *  matching the filter will be removed.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function removeFeatures(state, action) {
  // short hand the source source and the data
  const source = state.sources[action.sourceName];
  if (!source) {
    return state;
  }
  const data = source.data;

  // filter function, features which MATCH this function will be REMOVED.
  const match = createFilter(action.filter);

  if (data.type === 'Feature') {
    // if the feature should be removed, return an empty
    //  FeatureCollection
    if (match(data)) {
      return changeData(state, action.sourceName, {
        type: 'FeatureCollection',
        features: [],
      });
    }
  } else if (data.type === 'FeatureCollection') {
    const new_features = [];
    for (let i = 0, ii = data.features.length; i < ii; i++) {
      const feature = data.features[i];
      if (!match(feature)) {
        new_features.push(feature);
      }
    }

    const new_data = Object.assign({},
      data,
      {features: new_features},
    );

    return changeData(state, action.sourceName, new_data);
  }

  return state;
}

/** Set a layer visible in a mutually exclusive group.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function setLayerInGroupVisible(state, action) {
  const updated_layers = [];
  for (let i = 0, ii = state.layers.length; i < ii; i++) {
    const layer = state.layers[i];
    if (layer.metadata && layer.metadata[GROUP_KEY] === action.groupId) {
      updated_layers.push({
        ...layer,
        layout: {
          ...layer.layout,
          visibility: layer.id === action.layerId ? 'visible' : 'none',
        },
      });
    } else {
      updated_layers.push(layer);
    }
  }
  return Object.assign({}, state, {
    layers: updated_layers,
  }, incrementVersion(state.metadata, LAYER_VERSION_KEY));
}

/** Change the visibility of a layer given in the action.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function setVisibility(state, action) {
  let updated = false;
  const updated_layers = [];

  for (let i = 0, ii = state.layers.length; i < ii; i++) {
    const layer = state.layers[i];
    if (layer.id === action.layerId) {
      updated_layers.push({
        ...layer,
        layout: {
          ...layer.layout,
          visibility: action.visibility,
        },
      });
      updated = true;
    } else {
      updated_layers.push(layer);
    }
  }
  if (updated) {
    return Object.assign({}, state, {
      layers: updated_layers,
    }, incrementVersion(state.metadata, LAYER_VERSION_KEY));
  }
  // if nothing was updated, return the default state.
  return state;
}

/** Load a new context
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function setContext(state, action) {
  let metadata = incrementVersion(state.metadata, SOURCE_VERSION_KEY);
  metadata = incrementVersion(metadata.metadata, LAYER_VERSION_KEY);
  return Object.assign({}, action.context, {
    metadata: Object.assign({}, metadata.metadata, action.context.metadata)
  });
}

/** Update the map's metadata.
 *  @param {Object} state The redux state.
 *  @param {Object} action The selected action object.
 *
 *  @returns {Object} The new state object.
 */
function updateMetadata(state, action) {
  return Object.assign({}, state, {
    metadata: Object.assign({}, state.metadata, action.metadata),
  });
}

/** Add a group to the map's metadata section.
 *  @param {Object} state The redux state.
 *  @param {Object} action The action object.
 *
 *  @returns {Object} The new state object.
 */
function addGroup(state, action) {
  const groups = state.metadata ? Object.assign({}, state.metadata[GROUPS_KEY]) : {};
  groups[action.id] = action.config;
  const metadata = {};
  metadata[GROUPS_KEY] = groups;
  return Object.assign({}, state, {
    metadata: Object.assign({}, state.metadata, metadata),
  });
}

/** Remove a group from the map's metadata section.
 *  @param {Object} state The redux state.
 *  @param {Object} action The action object.
 *
 *  @returns {Object} The new state object.
 */
function removeGroup(state, action) {
  const groups = state.metadata ? Object.assign({}, state.metadata[GROUPS_KEY]) : {};
  delete groups[action.id];
  const metadata = {};
  metadata[GROUPS_KEY] = groups;
  return Object.assign({}, state, {
    metadata: Object.assign({}, state.metadata, metadata),
  });
}

/** Update a source's definition.
 *  This is a heavy-handed operation that will
 *  just mixin whatever is in the new object.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function updateSource(state, action) {
  const old_source = state.sources[action.sourceName];
  const new_source = {};
  new_source[action.sourceName] = Object.assign({}, old_source, action.sourceDef);
  const new_sources = Object.assign({}, state.sources, new_source);

  let metadata;
  if (new_source[action.sourceName].type === 'geojson') {
    metadata = incrementVersion(state.metadata, dataVersionKey(action.sourceName));
  } else {
    metadata = incrementVersion(state.metadata, SOURCE_VERSION_KEY);
  }
  return Object.assign({}, state, {
    sources: Object.assign({}, state.sources, new_sources),
  }, metadata);
}

/** Set the zoom level of the map.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function setZoom(state, action) {
  let zoom = Math.min(DEFAULT_ZOOM.MAX, action.zoom);
  zoom = Math.max(DEFAULT_ZOOM.MIN, zoom);
  return Object.assign({}, state, {zoom});
}

/** Fit the extent on the map. Can be used to zoom to a layer for instance.
 *  @param {Object} state Current state.
 *  @param {Object} action Action to handle.
 *
 *  @returns {Object} The new state.
 */
function fitExtent(state, action) {
  const extent = action.extent;
  const resolution = getResolutionForExtent(extent, action.size, action.projection);
  const zoom = getZoomForResolution(resolution, action.projection);
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  return Object.assign({}, state, {center, zoom});
}

/** Main reducer.
 *  @param {Object} state The redux state.
 *  @param {Object} action The selected action object.
 *
 *  @returns {Object} The new state object.
 */
export default function MapReducer(state = defaultState, action) {
  switch (action.type) {
    case MAP.SET_VIEW:
      if (action.view.zoom !== undefined) {
        return setZoom(Object.assign({}, state, action.view), {zoom: action.view.zoom});
      } else {
        return Object.assign({}, state, action.view);
      }
    case MAP.ZOOM_IN:
      return setZoom(state, {zoom: state.zoom + 1});
    case MAP.ZOOM_OUT:
      return setZoom(state, {zoom: state.zoom - 1});
    case MAP.SET_ZOOM:
      return setZoom(state, action);
    case MAP.FIT_EXTENT:
      return fitExtent(state, action);
    case MAP.SET_NAME:
      return Object.assign({}, state, {name: action.name});
    case MAP.SET_GLYPHS:
      return Object.assign({}, state, {glyphs: action.glyphs});
    case MAP.SET_SPRITE:
      return Object.assign({}, state, {sprite: action.sprite});
    case MAP.SET_BEARING:
      return Object.assign({}, state, {bearing: action.bearing});
    case MAP.ADD_LAYER:
      return addLayer(state, action);
    case MAP.REMOVE_LAYER:
      return removeLayer(state, action);
    case MAP.SET_LAYER_METADATA:
    case MAP.UPDATE_LAYER:
      return updateLayer(state, action);
    case MAP.CLEAR_LAYER_FILTER:
      return clearLayerFilter(state, action);
    case MAP.ADD_SOURCE:
      return addSource(state, action);
    case MAP.REMOVE_SOURCE:
      return removeSource(state, action);
    case MAP.ADD_FEATURES:
      return addFeatures(state, action);
    case MAP.REMOVE_FEATURES:
      return removeFeatures(state, action);
    case MAP.SET_LAYER_VISIBILITY:
      return setVisibility(state, action);
    case MAP.SET_LAYER_IN_GROUP_VISIBLE:
      return setLayerInGroupVisible(state, action);
    case MAP.RECEIVE_CONTEXT:
      return setContext(state, action);
    case MAP.ORDER_LAYER:
      return orderLayer(state, action);
    case MAP.CLUSTER_POINTS:
    case MAP.SET_CLUSTER_RADIUS:
      return clusterPoints(state, action);
    case MAP.UPDATE_METADATA:
      return updateMetadata(state, action);
    case MAP.ADD_GROUP:
      return addGroup(state, action);
    case MAP.REMOVE_GROUP:
      return removeGroup(state, action);
    case MAP.UPDATE_SOURCE:
      return updateSource(state, action);
    case MAP.MOVE_GROUP:
      return moveGroup(state, action);
    default:
      return state;
  }
}
