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
/** Utility functions for SDK.
 *
 *  This is the grab bag of universally useful functions.
 */

/** Compare two objects, uses JSON.stringify.
 */
export function jsonEquals(objectA, objectB) {
  return (JSON.stringify(objectA) === JSON.stringify(objectB));
}


/** Get a layer by it's id
 *
 *  @param layers - Array of GL layer objects.
 *  @param id     - The layer's ID.
 *
 *  @returns The layer or null if not found.
 */
export function getLayerById(layers, id) {
  for (let i = 0, ii = layers.length; i < ii; i++) {
    if (layers[i].id === id) {
      return layers[i];
    }
  }
  return null;
}

/** Get the max or min number in a given set of numbers
  * that may contain non-numbers
 */
function getNumericValues(values) {
  const arr = [];
  for (let i = 0, ii = values.length; i < ii; i++) {
    if (!isNaN(values[i])) {
      arr.push(values[i]);
    }
  }
  return arr;
}

export function getMin(...args) {
  const numbers = getNumericValues(args);
  if (numbers.length === 0) { return undefined; }
  if (numbers.length === 1) { return numbers[0]; }
  return Math.min.apply(this, getNumericValues(args));
}

export function getMax(...args) {
  const numbers = getNumericValues(args);
  if (numbers.length === 0) { return undefined; }
  if (numbers.length === 1) { return numbers[0]; }
  return Math.max.apply(this, getNumericValues(args));
}

/** Parse an arbitrary string as if it were a URL.
 *
 *  @param queryString {String} - The query string to parse.
 *
 * @returns An object with the key-value-pairs.
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

/** Convert an object into a query string.
 *
 *  @param query {Object} - An object representing key-value-pairs to encode.
 *
 * @returns A URL encoded string.
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

/** Reproject GeoJSON to mapbox gl style spec EPSG:4326
  * @param geoJSON - geoJSON object
  * @param destProj - ['EPSG:4326'] string of target projection for the data
  * @return array of geoJSON feature in destProj
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

/** Convert degrees to radians.
 *
 *  @param degrees - number, Bearing value on gl_map.
 *
 * @returns radians - number, rotation value on ol_map.
 */
export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Convert radians to degrees.
 *
 *  @param radians - number, rotation value on ol_map.
 *
 * @returns degrees - number, bearing value on gl_map.
 */
export function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}
