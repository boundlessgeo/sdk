/* global it, describe, expect */

import * as util from '../../src/util';

describe('util', () => {
  it('returns the minimum value in a set of numbers', () => {
    expect(util.getMin()).toEqual(undefined);
    expect(util.getMin(undefined, undefined)).toEqual(undefined);
    expect(util.getMin(undefined, 2)).toEqual(2);
    expect(util.getMin(3, 4, 5)).toEqual(3);
  });

  it('returns the maximum value in a set of numbers', () => {
    expect(util.getMax()).toEqual(undefined);
    expect(util.getMax(undefined, undefined)).toEqual(undefined);
    expect(util.getMax(undefined, 2)).toEqual(2);
    expect(util.getMax(3, 4, 5)).toEqual(5);
  });

  it('gets layer by id', () => {
    const layers = [{ id: 'osm', source: 'osm' }];
    expect(util.getLayerById(layers, 'foo')).toEqual(null);
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
});
