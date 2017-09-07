/* global it, describe, expect */

import React from 'react';
import { mount } from 'enzyme';

import { createStore, combineReducers } from 'redux';

import ConnectedMap from '../../src/components/map';
import MapReducer from '../../src/reducers/map';
import * as MapActions from '../../src/actions/map';

describe('Map component time tests', () => {
  it('should correctly reload WMS source that is time enabled', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const wrapper = mount(<ConnectedMap store={store} />);
    const map = wrapper.instance().getWrappedInstance();

    store.dispatch(MapActions.setView([-98, 40], 4));

    const getMapUrl = 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&SRS=EPSG:900913&LAYERS=nexrad-n0r-wmst&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';
    store.dispatch(MapActions.addSource('mesonet', {
      type: 'raster',
      tileSize: 256,
      tiles: [getMapUrl],
    }));
    store.dispatch(MapActions.addLayer({
      id: 'nexrad',
      source: 'mesonet',
    }));
    store.dispatch(MapActions.setLayerTime('nexrad', '1995-01-01/2017-12-31/PT5M'));

    let layers = map.map.getLayers().getArray();
    const source = layers[0].getSource();
    let params = source.getParams();
    expect(params.TIME).toBeUndefined();
    store.dispatch(MapActions.setMapTime('2006-06-23T03:10:00Z'));
    params = source.getParams();
    expect(params.TIME).toBe('2006-06-23T03:10:00Z');
  });

  it('should correctly set TIME param if source added after setMapTime', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const wrapper = mount(<ConnectedMap store={store} />);
    const map = wrapper.instance().getWrappedInstance();

    store.dispatch(MapActions.setView([-98, 40], 4));
    store.dispatch(MapActions.setMapTime('2006-06-23T03:10:00Z'));

    const getMapUrl = 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&SRS=EPSG:900913&LAYERS=nexrad-n0r-wmst&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';
    store.dispatch(MapActions.addSource('mesonet', {
      type: 'raster',
      tileSize: 256,
      tiles: [getMapUrl],
    }));
    store.dispatch(MapActions.addLayer({
      id: 'nexrad',
      source: 'mesonet',
    }));
    store.dispatch(MapActions.setLayerTime('nexrad', '1995-01-01/2017-12-31/PT5M'));

    let layers = map.map.getLayers().getArray();
    const source = layers[0].getSource();
    const params = source.getParams();
    expect(params.TIME).toBe('2006-06-23T03:10:00Z');
  });
});
