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

/** Drawing Reducer
 *
 *  This initiates drawing on the map and can track
 *  changes as they are made.
 *
 */

import { DRAWING } from '../action-types';

const defaultState = {
  interaction: null,
  sourceName: null,
  measureFeature: null,
  measureSegments: null,
};


function startDrawing(state, action) {
  return {
    interaction: action.interaction,
    sourceName: action.sourceName,
    measureFeature: null,
    measureSegments: null,
  };
}


export default function drawingReducer(state = defaultState, action) {
  switch (action.type) {
    case DRAWING.END:
      // when interaction is null, drawing should cease.
      return { interaction: null, sourceName: null, measureFeature: null, measureSegments: null };
    case DRAWING.START:
      return startDrawing(state, action);
    case DRAWING.SET_MEASURE_FEATURE:
      return Object.assign({}, state, {
        measureFeature: action.feature,
        measureSegments: action.segments,
      });
    case DRAWING.CLEAR_MEASURE_FEATURE:
      return Object.assign({}, state, {
        measureFeature: null,
        measureSegments: null,
      });
    default:
      return state;
  }
}
