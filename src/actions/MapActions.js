/*
* Copyright 2015-present Boundless Spatial Inc., http://boundlessgeo.com
* Licensed under the Apache License, Version 2.0 (the "License").
* You may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* http://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and limitations under the License.
*/

import {MAP} from './ActionTypes';
import MapConfigService from '../services/MapConfigService';

export const getMap = (map) => {
  return {
    type: MAP.GET_CONFIG,
    layers: MapConfigService.getMapState(map)
  };
};
export const getProjection = (map) => {
  return {
    type: MAP.GET_PROJECTION,
    projection: MapConfigService.getProjection(map)
  };
};
export function setView(view) {
  return {
    type: MAP.SET_VIEW,
    view
  }
}
export function lonLatToCenter(lon, lat, proj) {
  return {
    type: MAP.LON_LAT_TO_CENTER,
    center: MapConfigService.lonLatToCenter(lon, lat, proj)
  }
}
export function setSize(size) {
  return {
    type: MAP.SET_SIZE,
    size
  }
}
export function zoomToExtent(extent) {
  return {
    type: MAP.FIT_EXTENT,
    extent
  }
}
