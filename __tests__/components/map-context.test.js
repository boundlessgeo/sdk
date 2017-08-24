/* global it, describe, expect */

import React from 'react';
import { mount } from 'enzyme';

import TileLayer from 'ol/layer/tile';
import TileWMSSource from 'ol/source/tilewms';
import XYZSource from 'ol/source/xyz';

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import ConnectedMap from '../../src/components/map';
import MapReducer from '../../src/reducers/map';
import * as MapActions from '../../src/actions/map';

describe('Map component context documents', () => {
  it('should correctly reload context documents', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }), applyMiddleware(thunkMiddleware));

    const wrapper = mount(<ConnectedMap store={store} />);
    const map = wrapper.instance().getWrappedInstance();

    const wmsJson = {
      version: 8,
      name: 'states-wms',
      center: [-98.78906130124426, 37.92686191312036],
      zoom: 4,
      sources: {
        states: {
          type: 'raster',
          maxzoom: 12,
          tileSize: 256,
          tiles: ['https://ahocevar.com/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],
        },
      },
      layers: [
        {
          id: 'states-wms',
          source: 'states',
        },
      ],
    };
    store.dispatch(MapActions.setContext({ json: wmsJson }));
    let layers = map.map.getLayers().getArray();
    expect(layers[0]).toBeInstanceOf(TileLayer);
    expect(layers[0].getSource()).toBeInstanceOf(TileWMSSource);
    const osmJson = {
      version: 8,
      name: 'osm',
      center: [-98.78906130124426, 37.92686191312036],
      zoom: 4,
      sources: {
        osm: {
          type: 'raster',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
          tileSize: 256,
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
        },
      },
      layers: [
        {
          id: 'osm',
          source: 'osm',
        },
      ],
    };
    store.dispatch(MapActions.setContext({ json: osmJson }));
    layers = map.map.getLayers().getArray();
    expect(layers[0]).toBeInstanceOf(TileLayer);
    expect(layers[0].getSource()).toBeInstanceOf(XYZSource);
  });
});
