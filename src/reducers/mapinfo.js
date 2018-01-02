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

/** @module reducers/mapinfo
 * @desc Map Info Reducer
 */

import {MAPINFO} from '../action-types';

const defaultState = {
  size: null,
  mouseposition: {
    lngLat: null,
    coordinate: null,
  },
  extent: null,
};

/** Map info reducer.
 *  @param {Object} state The redux state.
 *  @param {Object} action The selected action object.
 *
 *  @returns {Object} The new state object.
 */
export default function mapInfoReducer(state = defaultState, action) {
  switch (action.type) {
    case MAPINFO.SET_EXTENT:
      return Object.assign({}, state, {extent: action.extent});
    case MAPINFO.SET_SIZE:
      return Object.assign({}, state, {size: action.size});
    case MAPINFO.SET_MOUSE_POSITION:
      return Object.assign({}, state, {mouseposition: {lngLat: action.lngLat, coordinate: action.coordinate}});
    default:
      return state;
  }
}
