/* global it, describe, expect, afterEach, beforeEach */

import React from 'react';
import { shallow, mount } from 'enzyme';
import nock from 'nock';

import { createStore, combineReducers } from 'redux';
import MapReducer from '../../src/reducers/map';

import SdkLegend from '../../src/components/legend';

describe('test the Legend component', () => {
  let store = null;
  const TEST_HTML = '<span>html legend</span>';
  const TEST_IMAGE = './spoof-legend.png';
  const TEST_HREF = '/spoof-legend.html';

  beforeEach(() => {
    store = createStore(combineReducers({
      map: MapReducer,
    }), {
      map: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tileSize: 256,
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
          },
          wms: {
            type: 'raster',
            tiles: [
              '/wms?SERVICE=WMS&LAYERS=x,y,z&FORMAT=image/png&EXCEPTIONS=image/png&BBOX={bbox-epsg-3857}',
            ],
          },
          other: {
            type: 'geojson',
            data: { },
          },
        },
        layers: [
          {
            id: 'osm',
            source: 'osm',
            metadata: {
              'bnd:legend-type': 'html',
              'bnd:legend-content': TEST_HTML,
            }
          },
          {
            id: 'wms-test',
            source: 'wms',
          },
          {
            id: 'html-test',
            source: 'other',
            metadata: {
              'bnd:legend-type': 'html',
              'bnd:legend-content': TEST_HTML,
            },
          },
          {
            id: 'href-test',
            source: 'other',
            metadata: {
              'bnd:legend-type': 'href',
              'bnd:legend-content': `http://example.com${TEST_HREF}`,
            },
          },
          {
            id: 'image-test',
            ref: 'href-test',
            metadata: {
              'bnd:legend-type': 'image',
              'bnd:legend-content': TEST_IMAGE,
            },
          },
          {
            id: 'null-test',
            source: 'other',
          },
        ],
      },
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should render the legend without error', () => {
    shallow(<SdkLegend layerId="wms" store={store} />);
  });

  it('should render a wms legend', () => {
    const wrapper = mount(<SdkLegend layerId="wms-test" store={store} />);

    // check for all the layers
    ['x', 'y', 'z'].forEach((layer) => {
      const test_src = `/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&EXCEPTIONS=image%2Fpng&LAYER=${layer}`;
      const expected_image = (
        <img alt="Legend" key={layer} className="sdk-legend-image" src={test_src} />
      );
      expect(wrapper.contains(expected_image)).toBe(true);
    });
  });

  it('should render an html legend', () => {
    const wrapper = mount(<SdkLegend layerId="html-test" store={store} />);
    expect(wrapper.html().indexOf(TEST_HTML)).toBeGreaterThan(-1);
  });

  it('should render an image legend', () => {
    const wrapper = mount(<SdkLegend layerId="image-test" store={store} />);
    expect(wrapper.html().indexOf(TEST_IMAGE)).toBeGreaterThan(-1);
  });

  it('should render an href legend', (done) => {
    nock('http://example.com/')
      .get(TEST_HREF)
      .reply(200, TEST_HTML);

    const wrapper = mount(<SdkLegend layerId="href-test" store={store} />);

    // this gives the nock-fetch a short amount of time
    // to render the HTML content.
    setTimeout(() => {
      expect(wrapper.html().indexOf(TEST_HTML)).toBeGreaterThan(-1);
      done();
    }, 300);
  });

  it('should test the null state', () => {
    mount(<SdkLegend layerId="null-test" store={store} />);
  });

  it('should fail miserably', () => {
    mount(<SdkLegend layerId="does-not-exist" store={store} />);
  });

  it('should fallback from raster to vector', () => {
    const wrapper = mount(<SdkLegend layerId="osm" store={store} />);
    expect(wrapper.html().indexOf(TEST_HTML)).toBeGreaterThan(-1);
  });
});
