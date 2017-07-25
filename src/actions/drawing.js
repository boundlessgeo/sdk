/** Actions for interacting with the map.
 */

import { DRAWING } from '../action-types';

export function startDrawing(sourceName, drawingType) {
  return {
    type: DRAWING.START,
    interaction: drawingType,
    sourceName,
  };
}

export function endDrawing() {
  return {
    type: DRAWING.END,
  };
}
