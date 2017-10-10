/* global it, describe, expect */

import deepFreeze from 'deep-freeze';

import reducer from '../../src/reducers/mapbox';
import { MAPBOX } from '../../src/action-types';

describe('Mapbox reducer', () => {
  it('should return default state', () => {
    const test_action = {
      type: 'foo',
    };
    deepFreeze(test_action);

    const expected_state = {
      accessToken: '',
      baseUrl: '',
    };

    expect(reducer(undefined, test_action)).toEqual(expected_state);
  });

  it('should set baseUrl', () => {
    const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/bright-v8';
    const test_action = {
      type: MAPBOX.SET_BASE_URL,
      baseUrl,
    };
    deepFreeze(test_action);

    const expected_state = {
      baseUrl,
      accessToken: '',
    };

    expect(reducer(undefined, test_action)).toEqual(expected_state);
  });

  it('should set accessToken', () => {
    const accessToken = 'pk.foo';
    const test_action = {
      type: MAPBOX.SET_ACCESS_TOKEN,
      accessToken,
    };
    deepFreeze(test_action);

    const expected_state = {
      accessToken,
      baseUrl: '',
    };

    expect(reducer(undefined, test_action)).toEqual(expected_state);
  });
});
