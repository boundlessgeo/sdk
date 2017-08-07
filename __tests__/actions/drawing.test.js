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

  it('should create an action to set measure feature and segments', () => {
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

    const expected_action = {
      type: DRAWING.SET_MEASURE_FEATURE,
      feature: line,
      segments: segs,
    };

    const action = actions.setMeasureFeature(line, segs);

    expect(action).toEqual(expected_action);
  });

  it('should create an action to clear the measure feature', () => {
    expect(actions.clearMeasureFeature()).toEqual({ type: DRAWING.CLEAR_MEASURE_FEATURE });
  });

  it('should start a measuring tool', () => {
    expect(actions.startMeasure(INTERACTIONS.measure_point)).toEqual({
      type: DRAWING.START,
      interaction: INTERACTIONS.measure_point,
      sourceName: null,
    });
  });
});
