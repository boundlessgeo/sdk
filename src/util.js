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

import GeoJsonFormat from 'ol/format/geojson';
/** @module util
 * @desc functions for Boundless SDK.
 *
 *  This is the grab bag of universally useful functions.
 */

/** Compares two objects using JSON.stringify.
 *
 * @param {Object} objectA The first object to be compared.
 * @param {Object} objectB An object to compare with objectA.
 *
 * @returns {boolean} True if objectA and objectB are deeply equal, false if not.
 */
export function jsonEquals(objectA, objectB) {
  return (JSON.stringify(objectA) === JSON.stringify(objectB));
}


/** Gets a layer by it's id. https://www.mapbox.com/mapbox-gl-js/style-spec/#layer-id
 *
 * @param {Object[]} layers An array of Mapbox GL layer objects.
 * @param {string} layers[].id - The id of a given layer.
 * @param {string} id The id of the layer object to be returned.
 *
 * @returns {(Object|null)} The Mapbox GL layer object, or null if not found.
 */
export function getLayerById(layers, id) {
  for (let i = 0, ii = layers.length; i < ii; i++) {
    if (layers[i].id === id) {
      return layers[i];
    }
  }
  return null;
}

/** Parses an arbitrary string as if it were a URL.
 *
 * @param {string} queryString The query string to parse.
 *
 * @returns {Object} An object containing the key-value-pairs of the parsed query string.
 */
export function parseQueryString(queryString) {
  const pairs = queryString.split('&');
  const results = {};
  for (let i = 0, ii = pairs.length; i < ii; i++) {
    // Using index of and substring has two advantages over split:
    // 1. It more gracefully handles components which have a = in them erroneously.
    // 2. It's slightly faster than using split.
    const pos = pairs[i].indexOf('=');
    const key = pairs[i].substring(0, pos);
    const value = decodeURIComponent(pairs[i].substring(pos + 1));

    results[key] = value;
  }
  return results;
}

/** Converts an object into a query string.
 *
 * @param {Object} query An object representing key-value-pairs to encode.
 *
 * @returns {string} A URL encoded string.
 */
export function encodeQueryObject(query) {
  const keys = Object.keys(query);
  const pairs = [];
  for (let i = 0, ii = keys.length; i < ii; i++) {
    const value = encodeURIComponent(query[keys[i]]);
    pairs.push(`${keys[i]}=${value}`);
  }
  return pairs.join('&');
}

/** Reprojects GeoJSON to Mapbox gl style spec EPSG:4326
 *
 * @param {Object} geoJSON - The geoJSON object to reproject.
 * @param {Object[]} geoJSON.features - An array of geoJSON features.
 * @param {string} [destProj = 'EPSG:4326'] A string of target projection for the data. The default is 'EPSG:4326'.
 *
 * @returns {Object[]} An array of geoJSON features in the destination projection (destProj).
 */
export function reprojectGeoJson(geoJSON, destProj = 'EPSG:4326') {
  const GEOJSON_FORMAT = new GeoJsonFormat();
  const crsName = GEOJSON_FORMAT.readProjectionFromObject(geoJSON).getCode();

  const readFeatureOptions = {
    featureProjection: destProj,
    dataProjection: crsName,
  };

  const writeFeatureOptions = {
    featureProjection: destProj,
    dataProjection: destProj,
  };

  const new_data = {
    type: 'FeatureCollection',
    features: geoJSON.features,
  };

  const features = GEOJSON_FORMAT.writeFeaturesObject(
    GEOJSON_FORMAT.readFeatures(new_data, readFeatureOptions), writeFeatureOptions);
  return features.features;
}

/** Converts degrees to radians.
 *
 * @param {number} degrees The bearing value on a Mapbox GL map object.
 *
 * @returns {number} The rotation value on the OpenLayers map object in radians.
 */
export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Converts radians to degrees.
 *
 * @param {number} radians The rotation value on an OpenLayers map object.
 *
 * @returns {number} The bearing value on the Mapbox GL map object in degrees.
 */
export function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

/** Uses JSON utilities to clone an object.
 *
 * @param {Object} object An object to be cloned.
 *
 * @returns {Object} The cloned object.
 */
export function jsonClone(object) {
  return JSON.parse(JSON.stringify(object));
}

/** Get a key from a dictionary with proper handling
 *  of when the dictionary is undefined.
 *
 *  @param {(Object|undefined)} dictionary An object or undefined.
 *  @param {string} key The key to pull from the dictionary.
 *
 *  @returns {(number|undefined)} Value.
 */
export function getKey(dictionary, key) {
  if(dictionary === undefined || dictionary === null) {
    return dictionary;
  }
  return dictionary[key];
}

/** Check the visibility of a layer.
 *
 *  @param layer The layer to check.
 *
 * @returns Boolean, true when visible, false when not.
 */
export function isLayerVisible(layer) {
  if (layer !== undefined && layer.layout !== undefined) {
    return layer.layout.visibility !== 'none';
  }
  return true;
}


/** Get the z-index of a layer.
 *
 *  @param layers The list of layers.
 *  @param id     The id of the layer to find.
 *
 * @returns integer index of the layer, or -1 if not found.
 */
export function getLayerIndexById(layers, id) {
  for (let i = layers.length - 1, ii = 0; i >= ii; i--) {
    if (layers[i].id === id) {
      return i;
    }
  }
  return -1;
}
