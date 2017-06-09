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


//import MapConfigService from '../services/MapConfigService';

export const getMapLayers = (mapLayers) => {
  return {
    // Unique identifier
    type: 'GET_MAP_LAYERS',
    // Payload
    mapLayers
  }
};

export const getMap = (map) => {
  return {
    // Unique identifier
    type: 'GET_MAP',
    // Payload
    map: MapConfigService.save(map)
    //mapJ: JSON.stringify(MapConfigService.save(map)),
    //layers: JSON.stringify(map.layers),
    //view: JSON.stringify(map.view)
  }
};
