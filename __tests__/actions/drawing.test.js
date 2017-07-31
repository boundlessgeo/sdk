/* global describe, it, expect */

import * as actions from '../../src/actions/drawing';
import { DRAWING } from '../../src/action-types';
import { INTERACTIONS } from '../../src/constants';

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

  it('should create an action to start modifying', () => {
    const source = 'test-points';

    const expectedAction = {
      type: DRAWING.START,
      interaction: INTERACTIONS.modify,
      sourceName: source,
    };
    expect(actions.startModify(source)).toEqual(expectedAction);
  });

  it('should create an action to start select', () => {
    const source = 'test-points';

    const expectedAction = {
      type: DRAWING.START,
      interaction: INTERACTIONS.select,
      sourceName: source,
    };
    expect(actions.startSelect(source)).toEqual(expectedAction);
  });

  it('should create an action to end drawing', () => {
    expect(actions.endDrawing()).toEqual({ type: DRAWING.END });
  });

  it('should create an action to end modify', () => {
    expect(actions.endModify()).toEqual({ type: DRAWING.END });
  });

  it('should create an action to end select', () => {
    expect(actions.endSelect()).toEqual({ type: DRAWING.END });
  });
});
