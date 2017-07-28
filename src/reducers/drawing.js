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
};


function startDrawing(state, action) {
  return {
    interaction: action.interaction,
    sourceName: action.sourceName,
  };
}


export default function drawingReducer(state = defaultState, action) {
  switch (action.type) {
    case DRAWING.END:
      // when interaction is null, drawing should cease.
      return { interaction: null, sourceName: null };
    case DRAWING.START:
      return startDrawing(state, action);
    default:
      return state;
  }
}
