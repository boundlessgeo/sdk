/** Actions for interacting with the map.
 */

import { DRAWING } from '../action-types';
import { INTERACTIONS } from '../constants';

/** Action to start an interaction on the map.
 */
export function startDrawing(sourceName, drawingType) {
  return {
    type: DRAWING.START,
    interaction: drawingType,
    sourceName,
  };
}

/** Short-hand action to start modify-feature */
export function startModify(sourceName) {
  return startDrawing(sourceName, INTERACTIONS.modify);
}

/** Short-hand action to start select-feature */
export function startSelect(sourceName) {
  return startDrawing(sourceName, INTERACTIONS.select);
}

/** Stop drawing / select / modify
 */
export function endDrawing() {
  return {
    type: DRAWING.END,
  };
}

// These are just aliases to end drawing.
export function endModify() {
  return endDrawing();
}

export function endSelect() {
  return endDrawing();
}
