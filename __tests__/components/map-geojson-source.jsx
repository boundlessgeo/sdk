/** Tests for geojson-type sources in the map.
 *
 */

import React from 'react';

import { createStore, combineReducers } from 'redux';

import { mount } from 'enzyme';

import SdkMap from '../../src/components/map';
import SdkPopup from '../../src/components/map/popup';
import MapReducer from '../../src/reducers/map';
import * as MapActions from '../../src/actions/map';
import nock from 'nock';



describe('tests for the geojson-type map sources', () => {
  let store = null;
  let map = undefined;

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

  function testGeojsonData(data, nFeatures) {
    const src_name = 'test-source';
    store.dispatch(MapActions.addSource(src_name, {
      type: 'geojson',
      data,
    }));

    // check to see if the map source is now defined.
    expect(map.sources[src_name]).not.toBe(undefined);

    // check the feature count matches.
    const src = map.sources[src_name];
    expect(src.getFeatures().length).toBe(nFeatures);
  }

  it('handles undefined data', () => {
    testGeojsonData(undefined, 0);
  });

  it('adds a geojson source with an empty object', () => {
    testGeojsonData({}, 0);
  });

  it('adds a geojson source with a single feature', () => {
    testGeojsonData({
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

  it('adds a geojson feature collection with two features', () => {
    testGeojsonData(feature_collection, 2);
  });

  it('adds a geojson feature collection from a url', (done) => {
    // mock up the url to call
    nock('http://example.com/')
      .get('test.geojson')
      .reply(200, JSON.stringify(feature_collection));

    // set the data to a URI string.
    const src_name = 'test-source';
    store.dispatch(MapActions.addSource(src_name, {
      type: 'geojson',
      data: 'http://example.com/test.geojson',
    }));

    // need a slight delay to let nock fetch the actions.
    setTimeout(() => {
      const n = feature_collection.features.length;
      expect(map.sources[src_name].getFeatures().length).toBe(n);
      done();
    }, 300);

  });
});
