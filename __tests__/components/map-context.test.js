/* global it, describe, expect */

import React from 'react';
import {mount, configure} from 'enzyme';
import  Adapter from 'enzyme-adapter-react-16';

import TileLayer from 'ol/layer/tile';
import TileWMSSource from 'ol/source/tilewms';
import XYZSource from 'ol/source/xyz';

import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';

import ConnectedMap from '../../src/components/map';
import MapReducer from '../../src/reducers/map';
import * as MapActions from '../../src/actions/map';

configure({adapter: new Adapter()});

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
    store.dispatch(MapActions.setContext({json: wmsJson}));
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
    store.dispatch(MapActions.setContext({json: osmJson}));
    layers = map.map.getLayers().getArray();
    expect(layers[0]).toBeInstanceOf(TileLayer);
    expect(layers[0].getSource()).toBeInstanceOf(XYZSource);
  });
  it('should parse mapbox style json correctly', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }), applyMiddleware(thunkMiddleware));

    const wrapper = mount(<ConnectedMap store={store} />);
    const map = wrapper.instance().getWrappedInstance();

    const mapboxJson = {
      version: 8,
      name: 'mapbox',
      center: [-98.78906130124426, 37.92686191312036],
      zoom: 4,
      sources: {
        'mapbox-streets': {
          type: "vector",
          url: "mapbox://mapbox.mapbox-streets-v7"
        },
        'mapbox://mapbox.satellite': {
          type: 'raster',
          tileSize: 256,
          url: 'mapbox://mapbox.satellite'
        }
      },
      layers: [
        {
          id: "mapbox-mapbox-satellite",
          interactive: true,
          paint: {},
          source: "mapbox://mapbox.satellite",
          type: "raster"
        },
        {
          filter : ["all", ["==", "$type", "LineString"]],
          id : "tunnel-secondary-tertiary case",
          interactive : true,
          layout : {'line-join': "round"},
          metadata : {'mapbox:group': "1460127465037.9006"},
          paint : {'line-color': "#fff", 'line-opacity': {base: 1, stops: [[13, 0], [13.5, 0.5], [16, 0.75], [18, 0.35]]}},
          source : "mapbox-streets",
          'source-layer': "road",
          type : "line",
        }
      ],
    };
    store.dispatch(MapActions.setContext({json: mapboxJson}));
    layers = map.map.getLayers().getArray();
    expect(layers[0]).toBeInstanceOf(TileLayer);
    expect(layers[0].getSource()).toBeInstanceOf(XYZSource);
  });
});
