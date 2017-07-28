/* global it, describe, expect */

import deepFreeze from 'deep-freeze';

import reducer from '../../src/reducers/drawing';
import { DRAWING } from '../../src/action-types';

describe('drawing reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({
      interaction: null,
      sourceName: null,
    });
  });

  it('should set the interaction and sourceName', () => {
    const source_name = 'points-test';
    const geo_type = 'Point';

    const test_action = {
      type: DRAWING.START,
      interaction: geo_type,
      sourceName: source_name,
    };
    deepFreeze(test_action);

    const expected_state = {
      interaction: geo_type,
      sourceName: source_name,
    };

    expect(reducer(undefined, test_action)).toEqual(expected_state);
  });

  it('should null out all the things', () => {
    const initial_state = {
      interaction: 'Point',
      sourceName: 'test-points',
    };
    deepFreeze(initial_state);

    const expected_state = {
      interaction: null,
      sourceName: null,
    };

    expect(reducer(initial_state, { type: DRAWING.END })).toEqual(expected_state);
  });
});
