/* global it, describe, expect, spyOn, afterEach */

import React from 'react';
import {shallow, mount, configure} from 'enzyme';
import nock from 'nock';
import  Adapter from 'enzyme-adapter-react-16';

import olMap from 'ol/pluggablemap';
import olView from 'ol/view';
import TileLayer from 'ol/layer/tile';
import VectorLayer from 'ol/layer/vector';
import ImageLayer from 'ol/layer/image';
import VectorTileLayer from 'ol/layer/vectortile';
import VectorTileSource from 'ol/source/vectortile';
import ImageStaticSource from 'ol/source/imagestatic';
import TileJSONSource from 'ol/source/tilejson';
import TileWMSSource from 'ol/source/tilewms';
import XYZSource from 'ol/source/xyz';
import ImageTile from 'ol/imagetile';
import TileState from 'ol/tilestate';

import {createStore, combineReducers} from 'redux';
import {radiansToDegrees} from '../../src/util';

import ConnectedMap, {Map} from '../../src/components/map';
import {hydrateLayer, getFakeStyle, getMapExtent} from '../../src/components/map';
import SdkPopup from '../../src/components/map/popup';
import MapReducer from '../../src/reducers/map';
import MapInfoReducer from '../../src/reducers/mapinfo';
import PrintReducer from '../../src/reducers/print';
import * as MapActions from '../../src/actions/map';
import * as PrintActions from '../../src/actions/print';

configure({adapter: new Adapter()});

describe('Map component', () => {
  it('should render without throwing an error', () => {
    const wrapper = shallow(<Map />);
    expect(wrapper.find('.sdk-map').length).toBe(1);
  });

  it('should allow for custom className', () => {
    const wrapper = shallow(<Map className='foo' />);
    expect(wrapper.find('.foo').length).toBe(1);
  });

  it('should create a map', () => {
    const sources = {
      osm: {
        type: 'raster',
        attribution: '&copy; <a href=\'https://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors.',
        tileSize: 256,
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
      },
      'states-wms': {
        type: 'raster',
        tileSize: 256,
        tiles: ['https://ahocevar.com/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],
      },
      points: {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0],
          },
          properties: {
            title: 'Null Island',
          },
        },
      },
      mvt: {
        type: 'vector',
        url: 'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=test_key',
      },
      mapbox: {
        url: 'mapbox://mapbox.mapbox-streets-v7',
        type: 'vector',
      },
      tile: {
        type: 'raster',
        tileSize: 256,
        tiles: ['https://www.example.com/foo?BBOX={bbox-epsg-3857}'],
      },
      tiletms: {
        type: 'raster',
        tileSize: 256,
        scheme: 'tms',
        tiles: ['http://www.example.com/tms/{z}/{x}/{y}.png'],
      },
      tilexyz: {
        type: 'raster',
        tileSize: 256,
        tiles: ['http://www.example.com/{z}/{x}/{y}.png'],
      },
    };
    const layers = [
      {
        id: 'osm',
        source: 'osm',
      }, {
        id: 'states',
        source: 'states-wms',
      }, {
        id: 'sample-points',
        source: 'points',
        type: 'circle',
        paint: {
          'circle-radius': 5,
          'circle-color': '#feb24c',
          'circle-stroke-color': '#f03b20',
        },
      }, {
        id: 'mvt-layer',
        source: 'mvt',
      }, {
        id: 'mapbox-layer',
        source: 'mapbox',
      }, {
        id: 'purple-points',
        ref: 'sample-points',
        paint: {
          'circle-radius': 5,
          'circle-color': '#cc00cc',
        },
        filter: ['==', 'isPurple', true],
      }, {
        id: 'tilelayer',
        source: 'tile',
      }, {
        id: 'tmslayer',
        source: 'tiletms',
      }, {
        id: 'xyzlayer',
        source: 'tilexyz',
      },
    ];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };

    const center = [0, 0];
    const zoom = 2;
    const apiKey = 'foo';
    const wrapper = mount(<Map
      mapbox={{accessToken: apiKey}}
      map={{center, zoom, sources, layers, metadata}}
    />);
    const map = wrapper.instance().map;
    expect(map).toBeDefined();
    expect(map).toBeInstanceOf(olMap);
    expect(map.getLayers().item(0)).toBeInstanceOf(TileLayer);
    expect(map.getLayers().item(1)).toBeInstanceOf(TileLayer);
    expect(map.getLayers().item(1).getSource()).toBeInstanceOf(TileWMSSource);
    const tileLoadFunction = map.getLayers().item(6).getSource().getTileLoadFunction();
    const tileCoord = [0, 0, 0];
    const state = TileState.IDLE;
    const src = 'https://www.example.com/foo?BBOX={bbox-epsg-3857}';
    const tile = new ImageTile(tileCoord, state, src, null, tileLoadFunction);
    tileLoadFunction(tile, src);
    // bbox substituted
    expect(tile.getImage().src).toBe('https://www.example.com/foo?BBOX=-20037508.342789244,20037508.342789244,20037508.342789244,60112525.02836773');
    // REQUEST param cleared
    expect(map.getLayers().item(1).getSource().getParams().REQUEST).toBe(undefined);
    expect(map.getLayers().item(2)).toBeInstanceOf(VectorLayer);
    expect(map.getLayers().item(3)).toBeInstanceOf(VectorTileLayer);
    const expected = `https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/{z}/{x}/{y}.vector.pbf?access_token=${apiKey}`;
    expect(map.getLayers().item(4).getSource().getUrls()[0]).toBe(expected);
    expect(map.getLayers().item(4).getSource().getUrls()[1]).toBe(expected.replace('a.', 'b.'));
    expect(map.getLayers().item(4).getSource().getUrls()[2]).toBe(expected.replace('a.', 'c.'));
    expect(map.getLayers().item(4).getSource().getUrls()[3]).toBe(expected.replace('a.', 'd.'));
    let tileUrlFunction = map.getLayers().item(7).getSource().getTileUrlFunction();
    expect(tileUrlFunction(tileCoord)).toBe('http://www.example.com/tms/0/0/1.png');
    tileUrlFunction = map.getLayers().item(8).getSource().getTileUrlFunction();
    expect(tileUrlFunction(tileCoord)).toBe('http://www.example.com/0/0/-1.png');
    // move the map.
    wrapper.setProps({
      zoom: 4,
    });
    spyOn(map, 'setTarget');
    wrapper.unmount();
    expect(map.setTarget).toHaveBeenCalledWith(null);
  });

  it('should ignore unknown types', () => {
    const sources = {
      overlay: {
        type: 'foo',
      },
    };
    const layers = [
      {
        id: 'overlay',
        source: 'overlay',
      },
    ];
    const center = [0, 0];
    const zoom = 2;
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const wrapper = mount(<Map map={{center, zoom, sources, layers, metadata}} />);
    const map = wrapper.instance().map;
    expect(map.getLayers().getLength()).toBe(0);
  });

  it('should create a static image', () => {
    const sources = {
      overlay: {
        type: 'image',
        url: 'https://www.mapbox.com/mapbox-gl-js/assets/radar.gif',
        coordinates: [
          [-80.425, 46.437],
          [-71.516, 46.437],
          [-71.516, 37.936],
          [-80.425, 37.936],
        ],
      },
    };
    const layers = [
      {
        id: 'overlay',
        source: 'overlay',
        type: 'raster',
        paint: {'raster-opacity': 0.85},
      },
    ];
    const center = [0, 0];
    const zoom = 2;
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const wrapper = mount(<Map map={{center, zoom, sources, layers, metadata}} />);
    const map = wrapper.instance().map;
    const layer = map.getLayers().item(0);
    expect(layer).toBeInstanceOf(ImageLayer);
    expect(layer.getOpacity()).toEqual(layers[0].paint['raster-opacity']);
    const source = layer.getSource();
    expect(source).toBeInstanceOf(ImageStaticSource);
  });

  it('should create mvt groups', () => {
    const sources = {
      mapbox: {
        url: 'mapbox://mapbox.mapbox-streets-v7',
        type: 'vector',
      },
    };
    const layers = [
      {
        id: 'landuse_overlay_national_park',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'landuse_overlay',
        filter: [
          '==',
          'class',
          'national_park'
        ],
        'paint': {
          'fill-color': '#d8e8c8',
          'fill-opacity': 0.75
        },
      }, {
        id: 'landuse_park',
        type: 'fill',
        source: 'mapbox',
        'source-layer': 'landuse',
        filter: [
          '==',
          'class',
          'park'
        ],
        paint: {
          'fill-color': '#d8e8c8'
        },
      }, {
        layout: {
          'text-font': [
            'Open Sans Italic',
            'Arial Unicode MS Regular'
          ],
          'text-field': '{name_en}',
          'text-max-width': 5,
          'text-size': 12
        },
        filter: [
          '==',
          '$type',
          'Point'
        ],
        type: 'symbol',
        source: 'mapbox',
        id: 'water_label',
        paint: {
          'text-color': '#74aee9',
          'text-halo-width': 1.5,
          'text-halo-color': 'rgba(255,255,255,0.7)'
        },
        'source-layer': 'water_label'
      }
    ];
    const center = [0, 0];
    const zoom = 2;
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const wrapper = mount(<Map map={{center, zoom, sources, layers, metadata}} />);
    const instance = wrapper.instance();
    const map = instance.map;
    expect(map.getLayers().getLength()).toBe(1); // 1 layer created
    const layer = map.getLayers().item(0);
    expect(layer).toBeInstanceOf(VectorTileLayer);
    const source = layer.getSource();
    expect(source).toBeInstanceOf(VectorTileSource);
    expect(layer.get('name')).toBe('mapbox-landuse_overlay_national_park,landuse_park,water_label');
    expect(instance.layers[layer.get('name')]).toBe(layer);
    spyOn(layer, 'setSource');
    instance.updateLayerSource('mapbox');
    expect(layer.setSource).toHaveBeenCalled();
  });

  it('should create a raster tilejson', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];

    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const center = [0, 0];
    const zoom = 2;
    const wrapper = mount(<Map map={{center, zoom, sources, layers, metadata}} />);
    const map = wrapper.instance().map;
    const layer = map.getLayers().item(0);
    expect(layer).toBeInstanceOf(TileLayer);
    const source = layer.getSource();
    expect(source).toBeInstanceOf(TileJSONSource);
  });

  it('should handle visibility changes', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];

    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const center = [0, 0];
    const zoom = 2;
    const wrapper = mount(<Map map={{center, zoom, sources, layers, metadata}} />);

    const instance = wrapper.instance();
    const map = instance.map;
    const layer = map.getLayers().item(0);
    expect(layer.getVisible()).toBe(true);
    const nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 0,
          'bnd:layer-version': 1,
        },
        sources,
        layers: [{
          id: 'tilejson-layer',
          source: 'tilejson',
          layout: {
            visibility: 'none',
          },
        }],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(layer.getVisible()).toBe(false);
  });

  it('should handle undefined center, zoom and bearing in constructor', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];

    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const wrapper = mount(<Map map={{sources, layers, metadata}} />);

    const instance = wrapper.instance();
    const map = instance.map;
    const view = map.getView();
    // default values should get set
    expect(view.getRotation()).toBe(0);
    expect(view.getCenter()).toBe(null);
    expect(view.getZoom()).toBe(undefined);
  });

  it('should handle undefined center, zoom, bearing in shouldComponentUpdate', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];

    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const center = [0, 0];
    const zoom = 2;
    const bearing = 45;
    const wrapper = mount(<Map map={{bearing, center, zoom, sources, layers, metadata}} />);

    const instance = wrapper.instance();
    const map = instance.map;
    const view = map.getView();
    // center in EPSG:4326
    const centerWGS84 = view.getCenter();

    const nextProps = {
      map: {
        center: undefined,
        zoom: undefined,
        bearing: undefined,
        metadata: {
          'bnd:source-version': 0,
          'bnd:layer-version': 0,
        },
        sources,
        layers,
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    // previous values should still be valid
    expect(radiansToDegrees(view.getRotation())).toBe(-45);
    expect(view.getZoom()).toBe(2 + 1);
    expect(view.getCenter()).toBe(centerWGS84);
  });

  it('should handle layout changes', () => {
    const sources = {
      geojson: {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0],
          },
          properties: {
            layer: 'symbol-layer',
          },
        },
      },
    };
    const layers = [{
      id: 'symbol-layer',
      source: 'geojson',
      'source-layer': 'symbol-layer',
      type: 'symbol',
      layout: {
        'icon-image': 'foo',
      },
    }];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const center = [0, 0];
    const zoom = 2;
    const wrapper = mount(<Map map={{center, zoom, sources, layers, metadata}} />);
    const instance = wrapper.instance();

    const map = instance.map;
    const layer = map.getLayers().item(0);
    const ol_style = layer.getStyle();

    // test that the style has been set to something
    expect(typeof ol_style).toEqual('function');
  });

  it('handles updates to geojson source', () => {
    const sources = {
      drone: {
        type: 'geojson',
        data: 'https://wanderdrone.appspot.com/',
      },
    };
    const layers = [{
      id: 'drone',
      source: 'drone',
    }];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const center = [0, 0];
    const zoom = 2;
    const wrapper = mount(<Map map={{center, zoom, sources, layers, metadata}} />);

    const instance = wrapper.instance();

    let nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 1,
          'bnd:layer-version': 1,
          'bnd:data-version:drone': 1
        },
        sources: {
          drone: {
            type: 'geojson',
            data: 'https://wanderdrone.appspot.com/',
          },
        },
        layers: [{
          id: 'drone',
          source: 'drone',
        }],
      },
    };
    let error = false;
    try {
      instance.shouldComponentUpdate.call(instance, nextProps);
    } catch (e) {
      error = true;
    }
    expect(error).toBe(false);
  });

  it('handles updates to source and layer min/maxzoom values', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
      minzoom: 2,
      maxzoom: 5,
    }];
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const center = [0, 0];
    const zoom = 2;
    const wrapper = mount(<Map map={{center, zoom, sources, layers, metadata}} />);

    const instance = wrapper.instance();
    const map = instance.map;
    const view = map.getView();
    const layer = map.getLayers().item(0);

    // min/max zoom values defined on source only
    let nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 1,
          'bnd:layer-version': 2,
        },
        sources: {
          tilejson: {
            type: 'raster',
            url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
            minzoom: 4,
            maxzoom: 8,
          },
        },
        layers: [{
          id: 'tilejson-layer',
          source: 'tilejson',
        }],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    let max_rez = view.constrainResolution(
      view.getMaxResolution(), nextProps.map.sources.tilejson.maxzoom - view.getMinZoom());
    expect(layer.getMaxResolution()).toEqual(max_rez);

    let min_rez = view.constrainResolution(
      view.getMaxResolution(), nextProps.map.sources.tilejson.minzoom - view.getMinZoom());
    expect(layer.getMinResolution()).toEqual(min_rez);

    // min.max zoom values defined on both source and layer def
    nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 2,
          'bnd:layer-version': 3,
        },
        sources: {
          tilejson: {
            type: 'raster',
            url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
            minzoom: 1,
            maxzoom: 7,
          },
        },
        layers: [{
          id: 'tilejson-layer',
          source: 'tilejson',
          minzoom: 2,
          maxzoom: 9,
        }],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    // the layer minzoom will be handled in the style and *not* on the layer itself.
    max_rez = view.constrainResolution(
      view.getMaxResolution(), nextProps.map.sources.tilejson.maxzoom - view.getMinZoom());
    expect(layer.getMaxResolution()).toEqual(max_rez);
    min_rez = view.constrainResolution(
      view.getMinResolution(), nextProps.map.sources.tilejson.minzoom - view.getMaxZoom());
    expect(layer.getMinResolution()).toEqual(min_rez);
  });

  it('should handle layer removal and re-adding', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];
    const center = [0, 0];
    const zoom = 2;
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const wrapper = mount(<Map map={{center, zoom, sources, layers, metadata}} />);
    const instance = wrapper.instance();
    const map = instance.map;
    expect(map.getLayers().item(0)).not.toBe(undefined);
    let nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 0,
          'bnd:layer-version': 1,
        },
        sources,
        layers: [],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(map.getLayers().getLength()).toBe(0);
    nextProps = {
      map: {
        center,
        zoom,
        metadata: {
          'bnd:source-version': 0,
          'bnd:layer-version': 2,
        },
        sources,
        layers,
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(map.getLayers().getLength()).toBe(1);
  });

  it('removes sources version definition when excluded from map spec', () => {
    const sources = {
      tilejson: {
        type: 'raster',
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
      },
    };
    const layers = [{
      id: 'tilejson-layer',
      source: 'tilejson',
    }];
    const center = [0, 0];
    const zoom = 2;
    const metadata = {
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
    };
    const wrapper = mount(<Map map={{sources, layers, center, zoom, metadata}} />);
    const instance = wrapper.instance();
    expect(instance.sourcesVersion).toEqual(0);
    const nextProps = {
      map: {
        center,
        zoom,
        sources,
        layers: [],
      },
    };
    instance.shouldComponentUpdate.call(instance, nextProps);
    expect(instance.sourcesVersion).toEqual(undefined);
  });

  it('should create a connected map', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));
    mount(<ConnectedMap store={store} />);
  });

  it('should set the map size', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
      mapinfo: MapInfoReducer,
    }));
    const wrapper = mount(<ConnectedMap store={store} />);
    const sdk_map = wrapper.instance().getWrappedInstance();
    sdk_map.map.getSize = function() {
      return [100, 200];
    };
    sdk_map.map.dispatchEvent({
      type: 'change:size',
    });
    expect(store.getState().mapinfo.size).toEqual([100, 200]);
  });


  it('should trigger the setView callback', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const wrapper = mount(<ConnectedMap store={store} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    store.dispatch(MapActions.setView([-45, -45], 11));

    sdk_map.map.getView().setCenter([0, 0]);
    sdk_map.map.dispatchEvent({
      type: 'moveend',
    });

    expect(store.getState().map.center).toEqual([0, 0]);
  });

  it('should trigger the setMousePosition callback', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
      mapinfo: MapInfoReducer,
    }));

    const props = {
      store,
    };
    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    sdk_map.map.dispatchEvent({
      type: 'pointermove',
      coordinate: [0, 0],
    });

    expect(store.getState().mapinfo.mouseposition.lngLat).toEqual({lng: 0, lat: 0});
  });

  it('should update the source url', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));
    const getMapUrl = 'https://demo.boundlessgeo.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&SRS=EPSG:900913&LAYERS=foo&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';
    store.dispatch(MapActions.addSource('foo', {
      type: 'raster',
      tileSize: 256,
      tiles: [getMapUrl],
    }));
    store.dispatch(MapActions.addLayer({
      id: 'foo',
      source: 'foo',
    }));

    const wrapper = mount(<ConnectedMap store={store} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    let source = sdk_map.sources['foo'];
    expect(source.getParams()['SALT']).toBeUndefined();
    store.dispatch(MapActions.updateSource('foo', {
      type: 'raster',
      tileSize: 256,
      tiles: [getMapUrl + '&SALT=0.556643'],
    }));
    source = sdk_map.sources['foo'];
    expect(source.getParams()['SALT']).toEqual('0.556643');
  });

  it('should trigger the setRotation callback', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const wrapper = mount(<ConnectedMap store={store} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    store.dispatch(MapActions.setBearing(20));
    expect(store.getState().map.bearing).toEqual(20);

    sdk_map.map.getView().setRotation(-5);
    sdk_map.map.dispatchEvent({
      type: 'moveend',
    });

    expect(store.getState().map.bearing).toEqual(radiansToDegrees(5));
  });

  it('should trigger renderSync on export image', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
      print: PrintReducer,
    }));
    const props = {
      store,
    };

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();
    spyOn(sdk_map.map, 'renderSync');
    store.dispatch(PrintActions.exportMapImage());

    // renderSync should get called.
    expect(sdk_map.map.renderSync).toHaveBeenCalled();
  });

  it('should trigger the popup-related callbacks', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));
    const onClick = (map, xy, featuresPromise) => {
      // check that something looking like a promise
      // was returned.
      expect(typeof featuresPromise.then).toBe('function');
    };

    // create a props dictionary which
    //  can include a spy.
    const props = {
      store,
      onClick,
      includeFeaturesOnClick: true,
    };
    spyOn(props, 'onClick');

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();
    spyOn(sdk_map.map, 'forEachFeatureAtPixel');
    sdk_map.map.dispatchEvent({
      type: 'postcompose',
    });

    sdk_map.map.dispatchEvent({
      type: 'singleclick',
      coordinate: [0, 0],
      // this fakes the clicking of the canvas.
      originalEvent: {
        // eslint-disable-next-line no-underscore-dangle
        target: sdk_map.map.getRenderer().canvas_,
      },
    });

    // onclick should get called when the map is clicked.
    expect(props.onClick).toHaveBeenCalled();

    // forEachFeatureAtPixel should get called when includeFeaturesOnClick is true
    expect(sdk_map.map.forEachFeatureAtPixel).toHaveBeenCalled();
  });

  it('should create an overlay for the initialPopups', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const props = {
      store,
      initialPopups: [(<SdkPopup coordinate={[0, 0]}><div>foo</div></SdkPopup>)],
    };


    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    expect(sdk_map.map.getOverlays().getLength()).toEqual(0);

    sdk_map.map.dispatchEvent({
      type: 'postcompose',
    });

    expect(sdk_map.map.getOverlays().getLength()).toEqual(1);
  });

  it('should add a popup', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const props = {
      store,
    };

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    expect(sdk_map.map.getOverlays().getLength()).toEqual(0);

    spyOn(sdk_map, 'updatePopups');
    sdk_map.addPopup(<SdkPopup coordinate={[0, 0]}><div>foo</div></SdkPopup>, false);
    expect(sdk_map.map.getOverlays().getLength()).toEqual(1);
    expect(sdk_map.updatePopups).toHaveBeenCalled();
  });

  it('should remove a popup', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const props = {
      store,
    };

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    sdk_map.addPopup(<SdkPopup coordinate={[0, 0]}><div>foo</div></SdkPopup>, false);
    spyOn(sdk_map, 'updatePopups');
    const id = sdk_map.map.getOverlays().item(0).get('popupId');
    sdk_map.removePopup(id);
    expect(sdk_map.updatePopups).toHaveBeenCalled();
  });

  it('should remove the overlay of the popup', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const props = {
      store,
    };

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    sdk_map.addPopup(<SdkPopup coordinate={[0, 0]}><div>foo</div></SdkPopup>, false);
    const id = sdk_map.map.getOverlays().item(0).get('popupId');
    sdk_map.popups[id].state.closed = true;
    sdk_map.updatePopups();
    expect(sdk_map.map.getOverlays().getLength()).toEqual(0);
  });

  it('should handle getFakeStyle', () => {
    const sprite = 'mapbox://foo';
    const baseUrl = 'http://example.com';
    const accessToken = 'mytoken';
    const layers = [{id: 'foo'}];
    const style = getFakeStyle(sprite, layers, baseUrl, accessToken);
    expect(style.sprite).toEqual(`${baseUrl}/sprite?access_token=${accessToken}`);
  });

  it('getMapExtent should work correctly', () => {
    const view = new olView({center: [0, 0], resolution: 1000});
    const extent = getMapExtent(view, [500, 250]);
    expect(extent).toEqual([-2.2457882102988034, -1.1228222300941866, 2.2457882102988034, 1.1228222300942008]);
  });

  it('should handle hydrateLayer', () => {
    const layer1 = {
      id: 'layer1',
      type: 'fill',
      source: 'foo',
      paint: {
        'fill-color': '#FF0000'
      }
    };
    const layer2 = {
      id: 'layer2',
      paint: {
        'fill-color': '#0000FF'
      },
      ref: 'layer1'
    };
    const layer = hydrateLayer([layer1, layer2], layer2);
    expect(layer.id).toBe('layer2');
    expect(layer.ref).toBe(undefined);
    expect(layer.paint['fill-color']).toBe('#0000FF');
    expect(layer.source).toBe('foo');
  });

  it('should call handleAsyncGetFeatureInfo', () => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const props = {
      store,
      includeFeaturesOnClick: true,
    };

    store.dispatch(MapActions.addSource('osm', {
      type: 'raster',
      tileSize: 256,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
    }));

    store.dispatch(MapActions.addLayer({
      id: 'osm',
      source: 'osm',
    }));

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();

    spyOn(sdk_map, 'handleAsyncGetFeatureInfo');

    sdk_map.queryMap({
      pixel: [0, 0],
    });

    expect(sdk_map.handleAsyncGetFeatureInfo).toHaveBeenCalled();
  });
});

describe('Map component async', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  // removed set spriteData tests as they are now handled in ol-mapbox-style

  it('should handle WMS GetFeatureInfo', (done) => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    const props = {
      store,
      includeFeaturesOnClick: true,
    };

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();
    let promises = [];
    const layer = {
      id: 'foo',
      source: 'mywms',
      metadata: {
        'bnd:queryable': true,
      },
    };
    // eslint-disable-next-line
    const response = {"type":"FeatureCollection","totalFeatures":"unknown","features":[{"type":"Feature","id":"bugsites.1","geometry":{"type":"Point","coordinates":[590232,4915039]},"geometry_name":"the_geom","properties":{"cat":1,"str1":"Beetle site"}}],"crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::26713"}}};
    nock('http://example.com')
      .get('/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=bar&LAYERS=bar&INFO_FORMAT=application%2Fjson&I=0&J=255&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&STYLES=&BBOX=0%2C0%2C2504688.5428486555%2C2504688.5428486555')
      .reply(200, response);

    sdk_map.sources = {
      mywms: new TileWMSSource({url: 'http://example.com/wms', params: {LAYERS: 'bar'}}),
    };
    // invisible layer ignored
    layer.layout = {visibility: 'none'};
    sdk_map.handleAsyncGetFeatureInfo(layer, promises, {coordinate: [100, 100]});
    expect(promises.length).toEqual(0);
    delete layer.layout;
    promises = [];
    // non queryable layer ignored
    layer.metadata['bnd:queryable'] = false;
    sdk_map.handleAsyncGetFeatureInfo(layer, promises, {coordinate: [100, 100]});
    expect(promises.length).toEqual(0);
    promises = [];
    layer.metadata['bnd:queryable'] = true;
    delete layer.layout;
    sdk_map.handleAsyncGetFeatureInfo(layer, promises, {coordinate: [100, 100]});
    expect(promises.length).toEqual(1);
    promises[0].then(function(features) {
      expect(features[layer.id][0].id).toBe('bugsites.1');
      done();
    });
  });

  it('should handle Esri GetFeatureInfo', (done) => {
    const store = createStore(combineReducers({
      map: MapReducer,
    }));

    store.dispatch(MapActions.setView([-45, -45], 11));

    const props = {
      store,
      includeFeaturesOnClick: true,
    };

    const wrapper = mount(<ConnectedMap {...props} />);
    const sdk_map = wrapper.instance().getWrappedInstance();
    sdk_map.map.getSize = function() {
      return [300, 300];
    };
    let promises = [];
    const layer = {
      id: 'foo',
      source: 'mywms',
      metadata: {
        'bnd:queryable': true,
        'bnd:query-endpoint': 'http://example.com/identify',
      },
    };
    // eslint-disable-next-line
    const response = {"results":[{"layerId":0,"layerName":"ushigh","value":"Multi-Lane Divided","displayFieldName":"TYPE","attributes":{"OBJECTID":"281","Shape":"Polyline","LENGTH":"124.679","TYPE":"Multi-Lane Divided","ADMN_CLASS":"Interstate","TOLL_RD":"N","RTE_NUM1":"40","RTE_NUM2":"","ROUTE":"Interstate  40","Shape_Length":"2.182181"},"geometryType":"esriGeometryPolyline","geometry":{"spatialReference":{"wkid":102100},"paths":[[[-10035026.9794618,4184192.41321696],[-10039863.8602667,4186507.90771703],[-10058344.2892869,4186795.13931307],[-10074044.8971256,4184729.85084201],[-10082837.9850594,4181792.17764161],[-10105638.1582591,4170327.73329184],[-10115868.3014353,4163464.98998342],[-10151614.7252565,4150862.14745806],[-10170743.9186755,4143051.31641744],[-10180703.8491623,4142175.78372325],[-10191369.5562355,4139428.17898129],[-10195548.1904265,4139522.78885466],[-10204280.8569411,4139699.59211255],[-10208725.3136425,4137812.17764192],[-10220539.3534125,4136610.72980474],[-10228992.6842444,4137340.89255395],[-10244114.0546956,4137190.34705713],[-10266751.9523214,4134360.96965315],[-10270636.7763633,4133810.88555451]]]}}]};
    nock('http://example.com')
      .get('/identify?geometryType=esriGeometryPoint&geometry=100%2C100&sr=3857&tolerance=2&mapExtent=-5015109.862818699%2C-5627254.2633134555%2C-5003644.308575923%2C-5615788.709070679&imageDisplay=300%2C300%2C90&f=json&pretty=false')
      .reply(200, response);

    sdk_map.sources = {
      mywms: new XYZSource({urls: ['http://example.com/export?F=image&FORMAT=PNG32&TRANSPARENT=true&SIZE=256%2C256&BBOX={bbox-epsg-3857}&BBOXSR=3857&IMAGESR=3857&DPI=90']}),
    };
    sdk_map.handleAsyncGetFeatureInfo(layer, promises, {coordinate: [100, 100]});
    expect(promises.length).toEqual(1);
    promises[0].then(function(features) {
      expect(features[layer.id][0].properties.OBJECTID).toBe('281');
      done();
    });
  });

});
