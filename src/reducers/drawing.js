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
