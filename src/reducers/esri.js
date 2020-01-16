/*
 * Copyright 2015-present Planet Federal Inc., http://www.planet.com
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

/** @module reducers/esri
 * @desc Esri Reducer
 *
 *  Handles Esri ArcGIS REST requests.
 *
 */

import {ESRI} from '../action-types';
import {addSource, removeSource} from './source';

const defaultState = {
  sources: {},
};

/** Esri reducer.
 *  @param {Object} state The redux state.
 *  @param {Object} action The selected action object.
 *
 *  @returns {Object} The new state object.
 */
export default function EsriReducer(state = defaultState, action) {
  switch (action.type) {
    case ESRI.ADD_SOURCE:
      return addSource(state, action);
    case ESRI.REMOVE_SOURCE:
      return removeSource(state, action);
    default:
      return state;
  }
}
