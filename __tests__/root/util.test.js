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
});
