/* global it, describe, expect, afterEach, beforeEach */

import React from 'react';
import { mount, configure } from 'enzyme';
import nock from 'nock';
import  Adapter from 'enzyme-adapter-react-16';

import { createStore, combineReducers } from 'redux';
import MapReducer from '../../src/reducers/map';

import SdkLegend from '../../src/components/legend';
import {getLegend, getPointGeometry, getLineGeometry, getPolygonGeometry} from '../../src/components/legend';

configure({ adapter: new Adapter() });

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
          unknown: {
            type: 'unknown',
          },
        },
        layers: [
          {
            id: 'osm',
            source: 'osm',
            metadata: {
              'bnd:legend-type': 'html',
              'bnd:legend-content': TEST_HTML,
            },
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
          {
            id: 'bad-type-test',
            source: 'other',
            metadata: {
              'bnd:legend-type': 'bad-type',
            },
          }, {
            id: 'vector-point-test',
            source: 'other',
            type: 'circle',
            paint: {
              'circle-radius': 5,
              'circle-color': '#756bb1',
              'circle-stroke-color': '#756bb1',
            },
          }, {
            id: 'vector-symbol-test',
            source: 'other',
            type: 'symbol',
            layout: {
              'icon-image': 'duck',
            },
          }, {
            id: 'vector-line-test',
            source: 'other',
            type: 'line',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            'paint': {
              'line-color': '#888',
              'line-width': 8
            }
          }, {
            id: 'vector-polygon-test',
            filter: ['==', 'class', 'motorway_link'],
            'source-layer': 'foobar',
            source: 'other',
            type: 'fill',
            paint: {
              'fill-color': '#088',
              'fill-opacity': 0.8
            },
          }, {
            id: 'unknown-layer',
            source: 'unknown',
            metadata: {
              'bnd:legend-type': 'image',
              'bnd:legend-content': TEST_IMAGE,
            },
          },
        ],
      },
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should render the legend without error', () => {
    mount(<SdkLegend layerId="wms-test" store={store} />);
  });

  it('should render a wms legend', () => {
    const wrapper = mount(<SdkLegend layerId="wms-test" store={store} />);

    // check for all the layers
    ['x', 'y', 'z'].forEach((layer) => {
      const test_src = `/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&EXCEPTIONS=image%2Fpng&LAYER=${layer}`;
      const expected_image = (
        <img alt={layer} key={layer} className="sdk-legend-image" src={test_src} />
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

  it('should render an image legend if unknown source type', () => {
    const wrapper = mount(<SdkLegend layerId="unknown-layer" store={store} />);
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

  it('should render an empty legend when id does not exist', () => {
    const wrapper = mount(<SdkLegend layerId="does-not-exist" store={store} />);
    expect(wrapper.find('.sdk-legend').length).toBe(1);
  });

  it('should fallback from raster to vector', () => {
    const wrapper = mount(<SdkLegend layerId="osm" store={store} />);
    expect(wrapper.html().indexOf(TEST_HTML)).toBeGreaterThan(-1);
  });

  it('should return an empty legend for an invalid legend type', () => {
    const wrapper = mount(<SdkLegend layerId="bad-type-test" store={store} />);
    expect(wrapper.find('.sdk-legend').length).toBe(1);
  });

  it('should allow for custom className', () => {
    const wrapper = mount(<SdkLegend layerId="bad-type-test" className='foo' store={store} />);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should allow for vector (point) legend', () => {
    const wrapper = mount(<SdkLegend layerId="vector-point-test" store={store} />);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should allow for vector (symbol) legend', () => {
    const wrapper = mount(<SdkLegend layerId="vector-symbol-test" store={store} />);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should allow for vector (line) legend', () => {
    const wrapper = mount(<SdkLegend layerId="vector-line-test" store={store} />);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should allow for vector (polygon) legend', () => {
    const wrapper = mount(<SdkLegend layerId="vector-polygon-test" store={store} />);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should allow for custom size', () => {
    const wrapper = mount(<SdkLegend size={[100, 100]} layerId="vector-polygon-test" store={store} />);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('should create the correct polygon geometry', () => {
    const poly = getPolygonGeometry([50, 50]);
    expect(poly.getCoordinates()).toEqual([[[17, 21], [19, 19], [31, 19], [33, 21], [33, 29], [31, 31], [19, 31], [17, 29]]]);
    const poly2 = getPolygonGeometry([50, 50]);
    expect(poly).toBe(poly2); // taken from cache
  });

  it('should create the correct point geometry', () => {
    const point = getPointGeometry([50, 50]);
    expect(point.getCoordinates()).toEqual([25, 25]);
    const point2 = getPointGeometry([50, 50]);
    expect(point).toBe(point2); // taken from cache
  });

  it('should create the correct line geometry', () => {
    const line = getLineGeometry([50, 50]);
    expect(line.getCoordinates()).toEqual([[17, 22], [22, 28], [28, 22], [33, 28]]);
    const line2 = getLineGeometry([50, 50]);
    expect(line).toBe(line2); // taken from cache
  });

  it('getLegend should return null if no metadata', () => {
    const layer = {};
    let legend = getLegend(layer);
    expect(legend).toEqual(null);
  });

  it('componentShouldReceiveProps should work correctly', () => {
    const wrapper = mount(<SdkLegend layerId="vector-point-test" store={store} />);
    let layer;
    const layers = store.getState().map.layers;
    for (let i = 0, ii = layers.length; i < ii; ++i) {
      if (layers[i].id === 'vector-point-test') {
        layer = layers[i];
        break;
      }
    }
    const legend = wrapper.instance().getWrappedInstance();
    let result = legend.componentWillReceiveProps({layers: [layer]});
    expect(result).toBe(false); // no need to update
    const newLayer = {id: 'vector-point-test'};
    result = legend.componentWillReceiveProps({layers: [newLayer]});
    expect(result).toBe(true); // layer changed so update
  });

});
