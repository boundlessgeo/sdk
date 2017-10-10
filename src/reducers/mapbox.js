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

/** @module reducers/mapbox
 * @desc Mapbox Reducer
 *
 *  Sets Mapbox info such as access token and base url.
 *
 */

import { MAPBOX } from '../action-types';

const defaultState = {
  baseUrl: undefined,
  accessToken: undefined,
};

/** Mapbox reducer.
 *  @param {Object} state The redux state.
 *  @param {Object} action The selected action object.
 *
 *  @returns {Object} The new state object.
 */
export default function MapboxReducer(state = defaultState, action) {
  switch (action.type) {
    case MAPBOX.CONFIGURE:
      return Object.assign({}, state, {baseUrl: action.baseUrl, accessToken: action.accessToken});
    default:
      return state;
  }
}
