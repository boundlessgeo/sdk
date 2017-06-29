/* global it, describe, expect */

import deepFreeze from 'deep-freeze';

import reducer from '../../src/reducers/print';
import { PRINT } from '../../src/action-types';

describe('print reducer', () => {
  it('should return default state', () => {
    const test_action = {
      type: 'foo',
    };
    deepFreeze(test_action);

    const expected_state = {
      exportImage: false,
    };

    expect(reducer(undefined, test_action)).toEqual(expected_state);
  });

  it('should set exportImage to true', () => {
    const test_action = {
      type: PRINT.EXPORT_IMAGE,
    };
    deepFreeze(test_action);

    const expected_state = {
      exportImage: true,
    };

    expect(reducer(undefined, test_action)).toEqual(expected_state);
  });

  it('should set exportImage to false when done', () => {
    const test_action = {
      type: PRINT.RECEIVE_IMAGE,
    };
    deepFreeze(test_action);

    const expected_state = {
      exportImage: false,
    };

    expect(reducer(undefined, test_action)).toEqual(expected_state);
  });
});
