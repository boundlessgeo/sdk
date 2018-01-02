/* global describe, it, expect */

import * as actions from '../../src/actions/mapinfo';
import {MAPINFO} from '../../src/action-types';

describe('test that mapinfo actions are properly created', () => {

  it('should issue an action to set the map size', () => {
    const size = [1000, 500];
    expect(actions.setMapSize(size)).toEqual({
      type: MAPINFO.SET_SIZE,
      size,
    });
  });

  it('should issue an action to set the map extent', () => {
    const extent = [-90, -45, 90, 45];
    expect(actions.setMapExtent(extent)).toEqual({
      type: MAPINFO.SET_EXTENT,
      extent,
    });
  });

  it('should issue an action to change the mouse position', () => {
    const lngLat = {lng: 50, lat: 45};
    const coordinate = [100000, 80000];
    expect(actions.setMousePosition(lngLat, coordinate)).toEqual({
      type: MAPINFO.SET_MOUSE_POSITION,
      lngLat,
      coordinate,
    });
  });

});

