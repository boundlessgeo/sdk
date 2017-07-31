/* global it, describe, expect */

import deepFreeze from 'deep-freeze';

import reducer from '../../src/reducers/map';
import { MAP } from '../../src/action-types';

describe('map reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      sources: {},
      layers: [],
    });
  });

  it('should handle ADD_LAYER', () => {
    const title = 'Background';
    const layer = {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': 'rgba(0,0,0,0)',
      },
    };
    deepFreeze(layer);
    const action = {
      type: MAP.ADD_LAYER,
      layerDef: layer,
      layerTitle: title,
    };
    deepFreeze(action);
    expect(reducer(undefined, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 1,
      },
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': 'rgba(0,0,0,0)',
          },
          metadata: {
            'bnd:title': title,
          },
          filter: null,
        },
      ],
    });
  });

  it('should handle SET_NAME', () => {
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      layers: [],
    };
    const name = 'New Name';
    deepFreeze(state);
    const action = {
      type: MAP.SET_NAME,
      name,
    };
    deepFreeze(action);
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'New Name',
      center: [0, 0],
      zoom: 3,
      sources: {},
      layers: [],
    });
  });

  it('should handle RECEIVE_CONTEXT', () => {
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      layers: [],
    };
    deepFreeze(state);
    const context = {
      version: 9,
      name: 'foo',
      center: [10, 10],
      zoom: 4,
    };
    const action = {
      type: MAP.RECEIVE_CONTEXT,
      context,
    };
    deepFreeze(action);
    expect(reducer(state, action)).toEqual(context);
  });

  it('should handle SET_LAYER_METADATA', () => {
    const title = 'Background';
    const layer = {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': 'rgba(0,0,0,0)',
      },
    };
    deepFreeze(layer);
    const action = {
      type: MAP.SET_LAYER_METADATA,
      layerId: 'background',
      key: 'bnd:title',
      value: title,
    };
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      sources: {},
      layers: [layer],
    };
    deepFreeze(state);
    deepFreeze(action);
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 1,
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': 'rgba(0,0,0,0)',
          },
          metadata: {
            'bnd:title': title,
          },
        },
      ],
    });
  });

  it('should handle SET_LAYER_VISIBILITY', () => {
    const layer = {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': 'rgba(0,0,0,0)',
      },
    };
    const osm = {
      id: 'osm',
      source: 'osm',
    };
    deepFreeze(layer);
    deepFreeze(osm);
    const action = {
      type: MAP.SET_LAYER_VISIBILITY,
      layerId: 'background',
      visibility: 'none',
    };
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      sources: {},
      layers: [layer, osm],
    };
    deepFreeze(state);
    deepFreeze(action);
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 1,
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': 'rgba(0,0,0,0)',
          },
          layout: {
            visibility: 'none',
          },
        }, {
          id: 'osm',
          source: 'osm',
        },
      ],
    });
  });

  it('should handle REMOVE_LAYER', () => {
    const layer = {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': 'rgba(0,0,0,0)',
      },
    };
    const other_layer = {
      id: 'other',
    };
    deepFreeze(layer);
    deepFreeze(other_layer);
    const action = {
      type: MAP.REMOVE_LAYER,
      layerId: 'background',
    };
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      layers: [layer, other_layer],
    };
    deepFreeze(state);
    deepFreeze(action);
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 1,
      },
      layers: [other_layer],
    });
  });

  it('should handle UPDATE_LAYER (background type)', () => {
    const layer = {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': 'rgba(0,0,0,0)',
      },
    };
    const other_layer = {
      id: 'other',
    };
    const newLayer = {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': 'rgba(255,0,0,0)',
      },
    };
    deepFreeze(layer);
    deepFreeze(other_layer);
    deepFreeze(newLayer);
    const action = {
      type: MAP.UPDATE_LAYER,
      layerId: 'background',
      layerDef: newLayer,
    };
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      layers: [layer, other_layer],
    };
    deepFreeze(state);
    deepFreeze(action);
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 1,
      },
      layers: [newLayer, other_layer],
    });
  });

  it('should handle UPDATE_LAYER (circle type)', () => {
    const layer = {
      id: 'random-points',
      source: 'points',
      type: 'circle',
      paint: {
        'circle-radius': 5,
        'circle-color': '#756bb1',
        'circle-stroke-color': '#756bb1',
      },
    };
    const newLayer = {
      id: 'random-points',
      source: 'points',
      type: 'circle',
      paint: {
        'circle-radius': 10,
        'circle-color': '#756bb1',
        'circle-stroke-color': '#756bb1',
      },
    };
    deepFreeze(layer);
    deepFreeze(newLayer);
    const action = {
      type: MAP.UPDATE_LAYER,
      layerId: 'random-points',
      layerDef: newLayer,
    };
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      layers: [layer],
    };
    deepFreeze(state);
    deepFreeze(action);
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 1,
      },
      layers: [newLayer],
    });
  });

  it('should handle ADD_SOURCE', () => {
    const raster_source = {
      type: 'raster',
      attribution: '&copy; <a href=\'https://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors.',
      tileSize: 256,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
    };
    const image_source = {
      type: 'image',
      url: 'https://www.mapbox.com/mapbox-gl-js/assets/radar.gif',
      coordinates: [
        [-80.425, 46.437],
        [-71.516, 46.437],
        [-71.516, 37.936],
        [-80.425, 37.936],
      ],
    };
    deepFreeze(raster_source);
    deepFreeze(image_source);
    const raster_action = {
      type: MAP.ADD_SOURCE,
      sourceName: 'osm',
      sourceDef: raster_source,
    };
    deepFreeze(raster_action);
    expect(reducer(undefined, raster_action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        osm: raster_source,
      },
      metadata: {
        'bnd:source-version': 1,
        'bnd:layer-version': 0,
      },
      layers: [],
    });
    const image_action = {
      type: MAP.ADD_SOURCE,
      sourceName: 'radar',
      sourceDef: image_source,
    };
    deepFreeze(image_action);
    expect(reducer(undefined, image_action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        radar: { ...image_source, data: {} },
      },
      metadata: {
        'bnd:source-version': 1,
        'bnd:layer-version': 0,
      },
      layers: [],
    });
  });

  it('should handle REMOVE_SOURCE', () => {
    const source = {
      type: 'raster',
      attribution: '&copy; <a href=\'https://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors.',
      tileSize: 256,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
    };
    deepFreeze(source);
    const action = {
      type: MAP.REMOVE_SOURCE,
      sourceName: 'osm',
    };
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        osm: source,
      },
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      layers: [],
    };
    deepFreeze(state);
    deepFreeze(action);
    expect(reducer(undefined, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 1,
        'bnd:layer-version': 0,
      },
      layers: [],
    });
  });

  it('should handle ADD_FEATURES to add action features to a source featureCollection', () => {
    // since we do not go through ADD_SOURCE we need to set _dataVersion
    // eslint-disable-next-line
    const source = {data: {type:'FeatureCollection',crs:{type:'name',properties:{'name':'urn:ogc:def:crs:OGC:1.3:CRS84'}},features:[{type:'Feature',properties:{'n':2,'cat':1},geometry:{type:'Point',coordinates:[0.5,0.5]}},{type:'Feature',properties:{'n':3,'cat':2},'geometry':{type:'Point',coordinates:[0.5,1.5]}}]}};
    deepFreeze(source);
    const action = {
      type: MAP.ADD_FEATURES,
      sourceName: 'points',
      // eslint-disable-next-line
      features: [{type:'Feature',properties:{'n':27,'cat':2},geometry:{type:'Point',coordinates:[2.5,5.5]}},{type:'Feature',properties:{'n':28,'cat':1},'geometry':{type:'Point',coordinates:[2.5,6.5]}}]
    };
    deepFreeze(action);
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        points: source,
      },
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      layers: [],
    };
    deepFreeze(state);
    // eslint-disable-next-line
    const newSource = {data: {type:'FeatureCollection',crs:{type:'name',properties:{'name':'urn:ogc:def:crs:OGC:1.3:CRS84'}},features:[{type:'Feature',properties:{'n':2,'cat':1},geometry:{type:'Point',coordinates:[0.5,0.5]}},{type:'Feature',properties:{'n':3,'cat':2},'geometry':{type:'Point',coordinates:[0.5,1.5]}},{type:'Feature',properties:{'n':27,'cat':2},'geometry':{type:'Point',coordinates:[2.5,5.5]}},{type:'Feature',properties:{'n':28,'cat':1},'geometry':{type:'Point',coordinates:[2.5,6.5]}}]}};
    deepFreeze(newSource);
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
        'bnd:data-version:points': 1,
      },
      sources: {
        points: newSource,
      },
      layers: [],
    });
  });

  it('should handle ADD_FEATURES to add action features to a source feature', () => {
    // since we do not go through ADD_SOURCE we need to set _dataVersion
    // eslint-disable-next-line
    const source = {data: {type:'Feature', properties:{'n':29,'cat':4}, geometry:{type:'Point', coordinates:[1.0,7.5]}}};
    deepFreeze(source);
    const action = {
      type: MAP.ADD_FEATURES,
      sourceName: 'points',
      // eslint-disable-next-line
      features: [{type:'Feature',properties:{'n':27,'cat':2},geometry:{type:'Point',coordinates:[2.5,5.5]}},{type:'Feature',properties:{'n':28,'cat':1},'geometry':{type:'Point',coordinates:[2.5,6.5]}}]
    };
    deepFreeze(action);
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        points: source,
      },
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      layers: [],
    };
    deepFreeze(state);
    // eslint-disable-next-line
    const newSource = {data: {type:'FeatureCollection', features: [source.data].concat(action.features)}};
    deepFreeze(newSource);
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
        'bnd:data-version:points': 1,
      },
      sources: {
        points: newSource,
      },
      layers: [],
    });
  });

  it('should handle ADD_FEATURES to add action features to a source with no data', () => {
    // since we do not go through ADD_SOURCE we need to set _dataVersion
    const source = {};
    deepFreeze(source);
    const action = {
      type: MAP.ADD_FEATURES,
      sourceName: 'points',
      // eslint-disable-next-line
      features: [{type:'Feature',properties:{'n':27,'cat':2},geometry:{type:'Point',coordinates:[2.5,5.5]}},{type:'Feature',properties:{'n':28,'cat':1},'geometry':{type:'Point',coordinates:[2.5,6.5]}}]
    };
    deepFreeze(action);
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        points: source,
      },
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      layers: [],
    };
    deepFreeze(state);
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
        'bnd:data-version:points': 1,
      },
      sources: {
        points: {
          ...source,
          data: {
            features: [
              ...action.features,
            ],
            type: 'FeatureCollection',
          },
        },
      },
      layers: [],
    });
  });

  it('should handle REMOVE_FEATURES', () => {
    // eslint-disable-next-line
    const source = {data: {type:'FeatureCollection',crs:{type:'name',properties:{'name':'urn:ogc:def:crs:OGC:1.3:CRS84'}},features:[{type:'Feature',properties:{'n':2,'cat':1},geometry:{type:'Point',coordinates:[0.5,0.5]}},{type:'Feature',properties:{'n':3,'cat':2},'geometry':{type:'Point',coordinates:[0.5,1.5]}}]}};
    deepFreeze(source);
    const action = {
      type: MAP.REMOVE_FEATURES,
      sourceName: 'points',
      filter: ['all', ['<', 'n', 3]],
    };
    deepFreeze(action);
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        points: source,
      },
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
        'bnd:data-version:points': 0,
      },
      layers: [],
    };
    // eslint-disable-next-line
    const newSource = {data: {type:'FeatureCollection',crs:{type:'name',properties:{'name':'urn:ogc:def:crs:OGC:1.3:CRS84'}},features:[{type:'Feature',properties:{'n':3,'cat':2},geometry:{type:'Point',coordinates:[0.5,1.5]}}]}};
    expect(reducer(state, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        points: newSource,
      },
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
        'bnd:data-version:points': 1,
      },
      layers: [],
    });
  });

  it('should re-arrange the layers', () => {
    const layer_a = {
      id: 'a',
      source: 'osm',
    };

    const layer_b = {
      id: 'b',
      source: 'osm',
    };

    const state = {
      source: {
        id: 'osm',
        type: 'raster',
      },
      layers: [
        layer_a, layer_b,
      ],
    };

    deepFreeze(state);

    const action = {
      type: MAP.ORDER_LAYER,
      layerId: layer_b.id,
      targetId: layer_a.id,
    };
    expect(reducer(state, action).layers).toEqual([layer_b, layer_a]);

    const top_action = {
      type: MAP.ORDER_LAYER,
      layerId: layer_a.id,
      targetId: undefined,
    };
    expect(reducer(state, top_action).layers).toEqual([layer_b, layer_a]);

    const null_action = {
      type: MAP.ORDER_LAYER,
      layerId: 4,
      targetId: layer_a.id,
    };
    expect(reducer(state, null_action).layers).toEqual([layer_a, layer_b]);
  });

  it('should update the map metadata', () => {
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
        'bnd:data-version:points': 0,
      },
      layers: [],
    };

    const sprite_root = './my-sprites';
    const sprite_action = {
      type: MAP.SET_SPRITES,
      sprites: sprite_root,
    };

    expect(reducer(state, sprite_action).sprites).toEqual(sprite_root);
  });

  it('should change the maps sprites', () => {
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {},
      layers: [],
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
        'bnd:some-key': 'some-value',
      },
    };
    deepFreeze(state);

    const action = {
      type: MAP.UPDATE_METADATA,
      metadata: {
        'bnd:some-key': 'other-value',
        'bnd:new-key': 'new-value',
      },
    };

    deepFreeze(action);

    expect(reducer(state, action).metadata).toEqual({
      'bnd:source-version': 0,
      'bnd:layer-version': 0,
      'bnd:some-key': 'other-value',
      'bnd:new-key': 'new-value',
    });
  });
});
