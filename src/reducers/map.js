/** Reducer to implement mapbox style document.
 */

import createFilter from '@mapbox/mapbox-gl-style-spec/feature_filter';

import { MAP } from '../action-types';
import { LAYER_VERSION_KEY, SOURCE_VERSION_KEY, TITLE_KEY, DATA_VERSION_KEY } from '../constants';

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
  metadata: defaultMetadata(),
  sources: {},
  layers: [],
};

function getVersion(metadata, version) {
  if (typeof (metadata) === 'undefined' || typeof (metadata[version]) === 'undefined') {
    return 0;
  }
  return metadata[version];
}

function incrementVersion(metadata, version) {
  const new_metadata = Object.assign({}, metadata);
  new_metadata[version] = getVersion(metadata, version) + 1;
  return {
    metadata: new_metadata,
  };
}

/** As there is no "source" metadata, this generates a unique key
 *  for the version of the data in the map's metadata object.
 */
export function dataVersionKey(sourceName) {
  return `${DATA_VERSION_KEY}:${sourceName}`;
}

/** Move a layer in the layers list.
 *
 */
function placeLayer(state, layer, targetId) {
  let placed = false;
  const new_layers = [];

  // do some sanity checks to prevent extra work
  //  when the targetId is not valid.
  for (let i = 0, ii = state.layers.length; i < ii; i++) {
    const l = state.layers[i];

    // if this is the target id then
    //  place the layer before adding the target
    //  back into the layer stack
    if (l.id === targetId) {
      new_layers.push(layer);
      placed = true;
    }

    // if the layer exists in the list,
    //  do not add it back inline.
    if (l.id !== layer.id) {
      new_layers.push(l);
    }
  }

  // whenever the targetId is not found,
  //  add the layer to the end of the list.
  if (!placed) {
    new_layers.push(layer);
  }

  return Object.assign({}, state, {
    layers: new_layers,
  }, incrementVersion(state.metadata, LAYER_VERSION_KEY));
}

/** Change the order of the layer in the stack.
 */
function orderLayer(state, action) {
  let layer = null;
  for (let i = 0, ii = state.layers.length; i < ii && layer === null; i++) {
    if (state.layers[i].id === action.layerId) {
      layer = state.layers[i];
    }
  }

  if (layer !== null) {
    return placeLayer(state, layer, action.targetId);
  }
  return state;
}

/** Add a layer to the state.
 */
function addLayer(state, action) {
  // TODO: Maybe decide on what a "default case" is in
  //       order to support easier dev.
  const new_layer = Object.assign({
    filter: null,
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

/** Update a layer that's in the state already.
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
 */
function addSource(state, action) {
  const new_source = {};
  new_source[action.sourceName] = Object.assign({}, action.sourceDef);
  if (action.sourceDef.type !== 'raster') {
    new_source[action.sourceName].data = Object.assign({}, action.sourceDef.data);
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
 *  @param {object} state - redux state
 *  @param {string} sourceName - name of the souce to be changed
 *  @param {array} data -  List of features to be added to the source
 *        If blank determined by openlayers
*
 */
function changeData(state, sourceName, data) {
  const source = state.sources[sourceName];
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
 */
function addFeatures(state, action) {
  const source = state.sources[action.sourceName];
  const data = source.data;

  // placeholder for the new data
  let new_data = null;

  // when there is no data, use the data
  // from the action.
  if (!data || !data.type) {
    // coerce this to a FeatureCollection.
    new_data = {
      type: 'FeatureCollection',
      features: action.features,
    };
  } else if (data.type === 'Feature') {
    new_data = {
      type: 'FeatureCollection',
      features: [data].concat(action.features),
    };
  } else if (data.type === 'FeatureCollection') {
    new_data = Object.assign({},
      data,
      { features: data.features.concat(action.features) },
    );
  }

  if (new_data !== null) {
    return changeData(state, action.sourceName, new_data);
  }
  return state;
}
/** Cluster points.
 */
function clusterPoints(state, action) {
  const source = state.sources[action.sourceName];
  const src_mixin = [];
  const cluster_settings = {};

  if (typeof action.cluster !== 'undefined') {
    cluster_settings.cluster = action.cluster;
    // MapBox GL style spec defaults to 50,
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
 *
 *  The action should define a filter, any feature
 *  matching the filter will be removed.
 *
 */
function removeFeatures(state, action) {
  // short hand the source source and the data
  const source = state.sources[action.sourceName];
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
      { features: new_features },
    );

    return changeData(state, action.sourceName, new_data);
  }

  return state;
}

/** Change the visibility of a layer given in the action.
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
 */
function setContext(state, action) {
  // simply replace the full state
  return Object.assign({}, action.context);
}

/** Update the map's metadata.
 */
function updateMetadata(state, action) {
  return Object.assign({}, state, {
    metadata: Object.assign({}, state.metadata, action.metadata),
  });
}

/** Main reducer.
 */
export default function MapReducer(state = defaultState, action) {
  switch (action.type) {
    case MAP.SET_VIEW:
      return Object.assign({}, state, action.view);
    case MAP.SET_NAME:
      return Object.assign({}, state, { name: action.name });
    case MAP.SET_SPRITES:
      return Object.assign({}, state, { sprites: action.sprites });
    case MAP.ADD_LAYER:
      return addLayer(state, action);
    case MAP.REMOVE_LAYER:
      return removeLayer(state, action);
    case MAP.SET_LAYER_METADATA:
    case MAP.UPDATE_LAYER:
      return updateLayer(state, action);
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
    case MAP.RECEIVE_CONTEXT:
      return setContext(state, action);
    case MAP.ORDER_LAYER:
      return orderLayer(state, action);
    case MAP.CLUSTER_POINTS:
    case MAP.SET_CLUSTER_RADIUS:
      return clusterPoints(state, action);
    case MAP.SET_METADATA:
      return updateMetadata(state, action);
    default:
      return state;
  }
}
