/** Tests for cluster sources in the map.
 *
 */

/* global it, describe, expect, beforeEach */

import React from 'react';
import VectorSource from 'ol/source/vector';
import { createStore, combineReducers } from 'redux';
import { mount } from 'enzyme';

import SdkClusterSource from '../../src/source/cluster';
import SdkMap from '../../src/components/map';
import MapReducer from '../../src/reducers/map';
import * as MapActions from '../../src/actions/map';


describe('tests for cluster map sources', () => {
  let map;
  let store;

  beforeEach(() => {
    store = createStore(combineReducers({
      map: MapReducer,
    }));

    const wrapper = mount(<SdkMap store={store} />);
    map = wrapper.instance().getWrappedInstance();
  });

  const data = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [5, 5],
      },
      properties: {
        sample: 'value',
      },
    }, {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [6, 6],
      },
      properties: {
        sample: 'value2',
      },
    }],
  };

  it('generates cluster geometry in correct projection', (done) => {
    expect.hasAssertions();
    store.dispatch(MapActions.setView([-93, 45], 5));
    const src_name = 'test-source';
    store.dispatch(MapActions.addSource(src_name, {
      type: 'geojson',
      data,
    }));

    setTimeout(() => {
      const src = map.sources[src_name];
      const features = src.getFeatures();
      expect(features.length).toBe(2);
      expect(src).toBeInstanceOf(VectorSource);
      store.dispatch(MapActions.clusterPoints(src_name, true));
      setTimeout(() => {
        const extent = [
          -14679659.940941697,
          3958251.750706631,
          -6025765.346607184,
          7284791.221677501,
        ];
        const resolution = 4891.96981025128;
        const proj = 'EPSG:3857';
        map.sources[src_name].loadFeatures(extent, resolution, proj);
        const cluster = map.sources[src_name];
        expect(cluster).toBeInstanceOf(SdkClusterSource);
        expect(cluster.getFeatures().length).toBe(1);
        const feature = cluster.getFeatures()[0];
        expect(feature.getGeometry().getCoordinates()[0]).not.toBe(5.5);
        done();
      }, 100);
    }, 100);
  });
});
