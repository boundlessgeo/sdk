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

/** @module actions/mapinfo
 *  @desc Actions for setting info about the map.
 */

import {MAPINFO} from '../action-types';

/** Action to set the map size.
 *  @param {number[]} size Map size in pixels.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setMapSize(size) {
  return {
    type: MAPINFO.SET_SIZE,
    size,
  };
}

/** Action to set the current mouse position.
 *  @param {Object} lngLat The longitude latitude object.
 *  @param {number[]} coordinate Coordinate pair in map projection.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setMousePosition(lngLat, coordinate) {
  return {
    type: MAPINFO.SET_MOUSE_POSITION,
    lngLat,
    coordinate,
  };
}

/** Action to set the map extent.
 *  @param {number[]} extent Map extent in EPSG:4326.
 *
 *  @returns {Object} Action object to pass to reducer.
 */
export function setMapExtent(extent) {
  return {
    type: MAPINFO.SET_EXTENT,
    extent,
  };
}
