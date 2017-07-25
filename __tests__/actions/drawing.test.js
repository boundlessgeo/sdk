/* global describe, it, expect */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actions from '../../src/actions/drawing';
import { DRAWING } from '../../src/action-types';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('drawing actions', () => {
  it('should create an action to start drawing', () => {
    const geo_type = 'Point';
    const source = 'test-points';

    const expectedAction = {
      type: DRAWING.START,
      interaction: geo_type,
      sourceName: source,
    };
    expect(actions.startDrawing(source, geo_type)).toEqual(expectedAction);
  });

  it('should create an action to end drawing', () => {
    expect(actions.endDrawing()).toEqual({type: DRAWING.END});
  });

});
