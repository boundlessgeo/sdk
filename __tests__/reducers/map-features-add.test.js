/* global it, describe, expect, beforeEach */

import deepFreeze from 'deep-freeze';

import proj from 'ol/proj';
import reducer from '../../src/reducers/map';
import { MAP } from '../../src/action-types';

describe('map reducer add features', () => {

  const SOURCE = {
    data: {
      type:'FeatureCollection',
      crs:{
        type:'name',
        properties:{
          'name':'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
      },
      features:[
        {
          type:'Feature',
          properties:{'n':2,'cat':1},
          geometry:{
            type:'Point',
            coordinates:[0.5,0.5]
          }
        },{
          type:'Feature',
          properties:{'n':3,'cat':2},
          'geometry':{
            type:'Point',
            coordinates:[0.5,1.5]
          }
        }
      ]
    }
  };
  const FEATURES = [
    {
      type:'Feature',
      properties:{'n':27,'cat':2},
      geometry:{
        type:'Point',
        coordinates:[2.5,5.5]
      }
    },{
      type:'Feature',
      properties:{'n':28,'cat':1},
      'geometry':{
        type:'Point',
        coordinates:[2.5,6.5]
      }
    }
  ];


  it('should handle ADD_FEATURES to add action features to a source featureCollection', () => {
    // since we do not go through ADD_SOURCE we need to set _dataVersion
    deepFreeze(SOURCE);
    const action = {
      type: MAP.ADD_FEATURES,
      sourceName: 'points',
      features: FEATURES
    };

    deepFreeze(action);
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        points: SOURCE,
      },
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      layers: [],
    };
    deepFreeze(state);
    const newSource = Object.assign({}, SOURCE, {
      data : Object.assign({}, SOURCE.data, {
        features:SOURCE.data.features.concat(FEATURES)  } )
      })

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
  it('should handle ADD_FEATURES with position, placing new features in source features array using position', () => {
    deepFreeze(SOURCE);
    const action = {
      type: MAP.ADD_FEATURES,
      sourceName: 'points',
      features: FEATURES,
      position:1
    };

    deepFreeze(action);
    const state = {
      version: 8,
      name: 'default',
      center: [0, 0],
      zoom: 3,
      sources: {
        points: SOURCE,
      },
      metadata: {
        'bnd:source-version': 0,
        'bnd:layer-version': 0,
      },
      layers: [],
    };
    deepFreeze(state);
    // SOURCE has 2 features, hand place SOURCE features around the added FEATURES
    const newSource = Object.assign({}, SOURCE, {
      data : Object.assign({}, SOURCE.data, {
        features:[SOURCE.data.features[0], ...FEATURES, SOURCE.data.features[1]]  } )
      })

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
  it('should handle ADD_FEATURES with unknown type', () => {
    // since we do not go through ADD_SOURCE we need to set _dataVersion
    const source = {data: {type:'Foo'}};
    deepFreeze(source);
    const action = {
      type: MAP.ADD_FEATURES,
      sourceName: 'points',
      features: FEATURES
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
    // since type is not known, it returns the passed in state
    expect(reducer(state, action)).toEqual(state);
  });

  it('should handle ADD_FEATURES to add action features to a source feature', () => {
    // since we do not go through ADD_SOURCE we need to set _dataVersion
    // eslint-disable-next-line
    const source = {data: {type:'Feature', properties:{'n':29,'cat':4}, geometry:{type:'Point', coordinates:[1.0,7.5]}}};
    deepFreeze(source);
    const action = {
      type: MAP.ADD_FEATURES,
      sourceName: 'points',
      features: FEATURES
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

  it('should reproject when handling ADD_FEATURES with a full feature collection', () => {
    // since we do not go through ADD_SOURCE we need to set _dataVersion
    // eslint-disable-next-line
    const source = {data: {type:'Feature', properties:{'n':29,'cat':4}, geometry:{type:'Point', coordinates:[1.0,7.5]}}};
    deepFreeze(source);
    const geom1 = [2000,2000];
    deepFreeze(geom1);
    const reprojectedGeom1 = proj.toLonLat(geom1);
    deepFreeze(reprojectedGeom1);
    const geom2 = [2000000,200000];
    deepFreeze(geom2);
    const reprojectedGeom2 = proj.toLonLat(geom2);
    deepFreeze(reprojectedGeom2);
    const action = {
      type: MAP.ADD_FEATURES,
      sourceName: 'points',
      // eslint-disable-next-line
      features: {type: 'FeatureCollection', crs:{type:'name',properties:{'name':'urn:ogc:def:crs:EPSG::3857'}},features: [{type:'Feature',properties:{'n':27,'cat':2},geometry:{type:'Point',coordinates:geom1}},{type:'Feature',properties:{'n':28,'cat':1},'geometry':{type:'Point',coordinates:geom2}}]}
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
    const reprojectedFeatures = [{"geometry": {"coordinates": reprojectedGeom1, "type": "Point"}, "properties": {"cat": 2, "n": 27}, "type": "Feature"}, {"geometry": {"coordinates": reprojectedGeom2, "type": "Point"}, "properties": {"cat": 1, "n": 28}, "type": "Feature"}];
    // eslint-disable-next-line
    const newSource = {data: {type:'FeatureCollection', features: [source.data].concat(reprojectedFeatures)}};
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
      features: FEATURES
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
});
