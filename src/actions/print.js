/** Actions for printing the map.
 */

import { PRINT } from '../action-types';

/** Action to export the current map image.
 */
export function exportMapImage() {
  return {
    type: PRINT.EXPORT_IMAGE,
  };
}

/** Action to handle receipt of the map image.
 */
export function receiveMapImage() {
  return {
    type: PRINT.RECEIVE_IMAGE,
  };
}
