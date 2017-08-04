/* global it, describe, expect */

import deepFreeze from 'deep-freeze';

import * as actions from '../../src/actions/drawing';
import reducer from '../../src/reducers/drawing';
import { DRAWING } from '../../src/action-types';

describe('drawing reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({
      interaction: null,
      sourceName: null,
      measureFeature: null,
      measureSegments: null,
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
      measureFeature: null,
      measureSegments: null,
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
      measureFeature: null,
      measureSegments: null,
    };

    expect(reducer(initial_state, { type: DRAWING.END })).toEqual(expected_state);
  });


  it('should set and clear the measure feature and segments', () => {
    const line = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Line',
        coordinates: [
          [0, 0], [1, 1], [2, 2],
        ],
      },
    };
    const segs = [1, 1];

    deepFreeze(line);
    deepFreeze(segs);

    const state = reducer(undefined, actions.setMeasureFeature(line, segs));
    deepFreeze(state);

    expect(state).toEqual({
      interaction: null,
      sourceName: null,
      measureFeature: line,
      measureSegments: segs,
    });

    const cleared_state = reducer(state, actions.clearMeasureFeature(line, segs));
    expect(cleared_state).toEqual({
      interaction: null,
      sourceName: null,
      measureFeature: null,
      measureSegments: null,
    });
  });
});
