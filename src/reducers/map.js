import {MAP} from '../actions/ActionTypes';
import {LAYER} from '../actions/ActionTypes';

const defaultState = {view: {}}

export default (state = defaultState, action) => {
  switch (action.type) {
    case MAP.GET_CONFIG:
      return {
        ...state,
        layers: action.layers
      }
    case MAP.GET_PROJECTION:
      return {
        ...state,
        view: {
          ...state.view,
          projection: action.projection
        }
      }
    case  MAP.SET_VIEW:
      const new_view = state.view;
      for (const key of ['center', 'resolution', 'rotation']) {
        if (typeof (action.view[key]) !== 'undefined') {
          new_view[key] = action.view[key];
        }
      }
      return {
        ...state,
        view: {
          ...new_view
        }
      };
    case LAYER.MOVE_LAYER:
      {
        let layers = [...state.layers];
        layers[action.source]['dragTargetIndex'] = action.target;
        layers[action.source]['dragSourceIndex'] = action.source;

        layers.splice(action.target,0, layers.splice(action.source,1)[0])
        return {
          ...state,
          layers: layers
        };
      }
    case LAYER.CLEAR_DRAG:
      {
        let layers = [...state.layers];
        layers.forEach(value => {
          if (value.dragSourceIndex) {
            delete value.dragSourceIndex;
            delete value.dragTargetIndex;
          }
        })
        return {
          ...state,
          layers: layers
        };
      }
    default:
      return state
  }
}
