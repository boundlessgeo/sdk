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
    deepFreeze(layer);
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
          layout: {
            visibility: 'none',
          },
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
    deepFreeze(layer);
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
      layers: [layer],
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
        'bnd:source-version': 0,
        'bnd:layer-version': 1,
      },
      layers: [],
    });
  });

  it('should handle UPDATE_LAYER', () => {
    const layer = {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': 'rgba(0,0,0,0)',
      },
    };
    const newLayer = {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': 'rgba(255,0,0,0)',
      },
    };
    deepFreeze(layer);
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
      type: MAP.ADD_SOURCE,
      sourceName: 'osm',
      sourceDef: source,
    };
    deepFreeze(action);
    expect(reducer(undefined, action)).toEqual({
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        osm: source,
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

  it('should handle ADD_FEATURES', () => {
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
  });
});
