import {MAP} from '../actions/ActionTypes';
import {LAYER} from '../actions/ActionTypes';

import ol from 'openlayers';

/** Take in the size of the map and extent and
 *   return a new "view" containing center and zoom.
 */

function convertFromExtent(mapSize, extent, rotation) {
  const view = new ol.View();
  view.fit(extent, {
    size: mapSize
  });

  return {
    resolution: view.getResolution(),
    center: view.getCenter(),
    rotation: rotation ? rotation : 0
  }
}

/** Reproject a point.
 *
 */
function projectPoint(pt, srcProj, destProj) {
  // Yes, this just wraps the OpenLayers functions but it keeps
  // library dependent code from being *directly* in the reducer.
  const p = (new ol.geom.Point(pt)).transform(srcProj, destProj);
  return p.getCoordinates();
}

const defaultState = {
  config: {
    // default projection for OpenLayers maps.
    projection: 'EPSG:3857',
    // maxExtent is specified in EPSG:4326 for interoperability.
    maxExtent: [-180.0, -90.0, 180.0, 90.0]
  },
  view: {}
}

export default (state = defaultState, action) => {
  switch (action.type) {
    case MAP.SET_PROJECTION:
      return {
        ...state,
        config: {
          ...state.config,
          projection: action.projection
        }
      }
    case MAP.SET_BOUNDS:
      return {
        ...state,
        config: {
          ...state.config,
          bounds: action.bounds
        }
      }
    case  MAP.SET_VIEW:
      const new_view = state.view;

      // if the action specifies a projection when setting the view,
      //  then pull that out and reproject the center.
      if (action.projection) {
        action.center = projectPoint(center, action.projection, state.config.projection);
      }
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
    case MAP.SET_SIZE:
      return {
        ...state,
        size: action.size
      };
    case MAP.FIT_EXTENT:
      return {
        ...state,
        view: convertFromExtent(state.size, action.extent, state.rotation)
      }
    default:
      return state
  }
}
