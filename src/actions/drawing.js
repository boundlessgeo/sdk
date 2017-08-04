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


/** Start measuring.
 */
export function startMeasure(interaction) {
  return startDrawing(null, interaction);
}

/** Set a measurement feature.
 *
 *  This is called each time the feature is updated.
 *
 *  @param feature  - The feature in WGS84.
 *  @param segments - Array of the incremental measurements in meters.
 *                    [] for a Point, [total_area] for a polygon.
 *
 *  @returns a measurement action.
 */
export function setMeasureFeature(feature, segments) {
  return {
    type: DRAWING.SET_MEASURE_FEATURE,
    feature,
    segments,
  };
}

/** Clear the measurement feature.
 */
export function clearMeasureFeature() {
  return {
    type: DRAWING.CLEAR_MEASURE_FEATURE,
  };
}
