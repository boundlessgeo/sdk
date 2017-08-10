/** Tests for geojson-type sources in the map.
 *
 */

/* global it, describe, expect, beforeEach, afterEach */

import React from 'react';
import { createStore, combineReducers } from 'redux';
import { mount } from 'enzyme';
import nock from 'nock';

import SdkMap from '../../src/components/map';
import MapReducer from '../../src/reducers/map';
import * as MapActions from '../../src/actions/map';


describe('tests for the geojson-type map sources', () => {
  let map;
  let store;

  beforeEach(() => {
    store = createStore(combineReducers({
      map: MapReducer,
    }));

    const wrapper = mount(<SdkMap store={store} />);
    map = wrapper.instance().getWrappedInstance();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('ensures map is not undefined', () => {
    expect(map).not.toBe(undefined);
  });

  function testGeojsonData(done, data, nFeatures) {
    const src_name = 'test-source';
    store.dispatch(MapActions.addSource(src_name, {
      type: 'geojson',
      data,
    }));

    // check to see if the map source is now defined.
    expect(map.sources[src_name]).not.toBe(undefined);

    // check the feature count matches.
    setTimeout(() => {
      const src = map.sources[src_name];
      expect(src.getFeatures().length).toBe(nFeatures);
      done();
    }, 100);
  }

  it('handles undefined data', (done) => {
    testGeojsonData(done, undefined, 0);
  });

  it('adds a geojson source with an empty object', (done) => {
    testGeojsonData(done, {}, 0);
  });

  it('adds a geojson source with a single feature', (done) => {
    testGeojsonData(done, {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
      properties: {
        sample: 'value',
      },
    }, 1);
  });

  const feature_collection = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
      properties: {
        sample: 'value',
      },
    }, {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-45, 0],
      },
      properties: {
        sample: 'value2',
      },
    }],
  };

  it('adds a geojson feature collection with two features', (done) => {
    testGeojsonData(done, feature_collection, 2);
  });

  it('adds a geojson feature collection from a url', (done) => {
    // mock up the url to call
    nock('http://example.com')
      .get('/test.geojson')
      .reply(200, JSON.stringify(feature_collection));

    testGeojsonData(done, 'http://example.com/test.geojson', 2);
  });

  it('tries to fetch a geojson file that does not exist', (done) => {
    testGeojsonData(done, 'http://example.com/no-where.geojson', 0);
  });

  it('fetches a bad geojson file', (done) => {
    nock('http://example.com')
      .get('/bad.geojson')
      .reply(200, 'alphabet soup');

    testGeojsonData(done, 'http://example.com/bad.geojson', 0);
  });
});
