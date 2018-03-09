/* global it, describe, expect */

import * as util from '../../src/util';
import {GROUP_KEY, TITLE_KEY} from '../../src/constants';

describe('util', () => {
  it('calculates the resolution for zoom', () => {
    const zoom = 4;
    const resolution = util.getResolutionForZoom(zoom);
    expect(resolution).toEqual(4891.96981025128);
  });

  it('calculates the zoom for resolution', () => {
    const resolution = 4891.96981025128;
    const zoom = util.getZoomForResolution(resolution);
    expect(zoom).toEqual(4);
  });

  it('calculates resolution for extent', () => {
    const extent = [-45, 0, -25, 20];
    const size = [1000, 600];
    const projection = 'EPSG:3857';
    const resolution = util.getResolutionForExtent(extent, size, projection);
    expect(resolution).toEqual(3788.3848783128165);
  });

  it('gets layer by id', () => {
    const layers = [{id: 'osm', source: 'osm'}];
    expect(util.getLayerById(layers, 'foo')).toEqual(null);
    expect(util.getLayerById(layers, 'osm')).toEqual(layers[0]);
  });

  it('gets the layer title if no title metadata', () => {
    const layer = {id: 'osm'};
    expect(util.getLayerTitle(layer)).toEqual('osm');
  });

  it('gets the layer group', () => {
    const metadata = {};
    metadata[GROUP_KEY] = 'overlays';
    const layer = {id: 'osm', metadata: metadata};
    expect(util.getGroup(layer)).toEqual('overlays');
  });

  it('gets null for the layer group if no mapbox:group', () => {
    const metadata = {};
    const layer = {id: 'osm', metadata: metadata};
    expect(util.getGroup(layer)).toEqual(null);
  });

  it('gets null for the layer group if no layer', () => {
    expect(util.getGroup()).toEqual(null);
  });

  it('gets null for the layer group if no metadata', () => {
    const layer = {id: 'osm'};
    expect(util.getGroup(layer)).toEqual(null);
  });

  it('gets the layer title from metadata', () => {
    const metadata = {};
    metadata[TITLE_KEY] = 'foo';
    const layer = {id: 'osm', metadata: metadata};
    expect(util.getLayerTitle(layer)).toEqual('foo');
  });

  it('converts degrees to radians', () => {
    expect(util.degreesToRadians(0)).toEqual(0);
    expect(util.degreesToRadians(1)).toBeCloseTo(0.017);
    expect(util.degreesToRadians(45)).toBeCloseTo(0.785);
    expect(util.degreesToRadians(90)).toBeCloseTo(1.570);
    expect(util.degreesToRadians(360)).toBeCloseTo(6.283);
  });

  it('converts radians to degrees', () => {
    expect(util.radiansToDegrees(0)).toEqual(0);
    expect(util.radiansToDegrees(1)).toBeCloseTo(57.295);
    expect(util.radiansToDegrees(2)).toBeCloseTo(114.591);
    expect(util.radiansToDegrees(7)).toBeCloseTo(401.070);
  });

  it('compares two objects for equality', () => {
    const paint = {
      'circle-radius': 5,
      'circle-color': '#756bb1',
      'circle-stroke-color': '#756bb1',
    };
    const new_paint = {
      'circle-radius': 10,
      'circle-color': '#f03b20',
      'circle-stroke-color': '#f03b20',
    };
    const same_paint = {
      'circle-radius': 5,
      'circle-color': '#756bb1',
      'circle-stroke-color': '#756bb1',
    };
    expect(util.jsonEquals(paint, new_paint)).toEqual(false);
    expect(util.jsonEquals(paint, same_paint)).toEqual(true);
  });

  it('parses and decodes a query string', () => {
    const query_string = 'what=%2Fis%20slash&roses=3000';
    const parsed = {
      what: '/is slash',
      roses: '3000',
    };

    expect(util.parseQueryString(query_string)).toEqual(parsed);

    expect(util.encodeQueryObject(parsed)).toBe(query_string);
  });
  it('reprojects geojson data to target crs', () => {
    const geoJson3857 = {
      type: 'FeatureCollection',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::3857',
        },
      },
      features: [
        {
          type: 'Feature',
          properties: {
            cat: 1,
          },
          geometry: {
            type: 'Point',
            coordinates: [
              -18142325,
              10318077,
            ],
          },
        },
      ],
    };

    const geoJson4326 = {
      type: 'FeatureCollection',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326',
        },
      },
      features: [
        {
          type: 'Feature',
          properties: {
            cat: 1,
          },
          geometry: {
            type: 'Point',
            coordinates: [
              -162.97527836963695,
              67.56207748693251,
            ],
          },
        },
      ],
    };

    const features3857 = [
      {
        type: 'Feature',
        properties: {
          cat: 1,
        },
        geometry: {
          type: 'Point',
          coordinates: [
            -18142325,
            10318077,
          ],
        },
      },
    ];
    const features4326 = [
      {
        type: 'Feature',
        properties: {
          cat: 1,
        },
        geometry: {
          type: 'Point',
          coordinates: [
            -162.97527836963695,
            67.56207748693251,
          ],
        },
      },
    ];

    // convert 3857 to 4326
    expect(util.reprojectGeoJson(geoJson3857)).toEqual(features4326);
    // pass in 4326 without a projection and get back 4326
    expect(util.reprojectGeoJson(geoJson4326)).toEqual(features4326);
    // pass in 4326 and destination projection and get back 3857
    expect(util.reprojectGeoJson(geoJson4326, 'EPSG:3857')).toEqual(features3857);
    // pass in 3857 and destination projection and get back 4326
    expect(util.reprojectGeoJson(geoJson3857, 'EPSG:4326')).toEqual(features4326);
  });

  function getSampleLayers() {
    return [{
      id: 'A',
      metadata: {
        'mapbox:group': 'grp',
      },
    }, {
      id: 'B',
      metadata: {
        'mapbox:group': 'grp',
      },
    }, {
      id: 'C',
    }];
  }

  it('tests find a layer in a list by id', () => {
    const layers = getSampleLayers();

    expect(util.getLayerIndexById(layers, 'A')).toBe(0);

    expect(util.getLayerIndexById(layers, 'D')).toBe(-1);
  });

  it('gets a set of layers by group id', () => {
    const layers = getSampleLayers();
    const matches = util.getLayersByGroup(layers, 'grp');

    // check to see the first two layers were found.
    expect(matches).toEqual(layers.slice(0, 2));
  });

  describe('optionalEquals tests', function() {
    function makeTree(value) {
      return {
        element: {
          name: value,
        },
      };
    }
    it('finds equal values between two fully defined trees', function() {
      const state = makeTree('A');
      const next_state = makeTree('A');
      expect(util.optionalEquals(state, next_state, 'element', 'name')).toEqual(true);
    });

    it('finds unequal values between two fully defined trees', function() {
      const state = makeTree('A');
      const next_state = makeTree('B');
      expect(util.optionalEquals(state, next_state, 'element', 'name')).toEqual(false);
    });

    it('finds unequal values between a tree with an undefined value', function() {
      const state = makeTree('A');
      const next_state = makeTree(undefined);
      expect(util.optionalEquals(state, next_state, 'element', 'name')).toEqual(false);
    });

    it('is false when either tree is undefined;', function() {
      let state = makeTree('A');
      let next_state = {};
      expect(util.optionalEquals(state, next_state, 'element', 'name')).toEqual(false);

      state = {};
      next_state = makeTree('B');
      expect(util.optionalEquals(state, next_state, 'element', 'name')).toEqual(false);
    });


  });

});
