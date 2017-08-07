/** Print Reducer
 *
 *  Exports map image.
 *
 */

import { PRINT } from '../action-types';

const defaultState = {
  exportImage: false,
};

export default function printReducer(state = defaultState, action) {
  switch (action.type) {
    case PRINT.EXPORT_IMAGE:
      return { exportImage: true };
    case PRINT.RECEIVE_IMAGE:
      return { exportImage: false };
    default:
      return state;
  }
}
