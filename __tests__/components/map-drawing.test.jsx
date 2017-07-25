/* global it, describe, expect */

/** Specific tests for map interactions.
 *
 *  This is *not* intended to be a complete test of the map,
 *  it only tests the drawing related functionality. See map.test.jsx
 *  for a more complete test of the map component.
 *
 */

import React from 'react';
import { shallow, mount } from 'enzyme';

import { createStore, combineReducers } from 'redux';

// jsdom / enzyme / jest will include <canvas> support
// but not the full API, this dummys the CanvasPattern
// and CanvasGradient objects so that OL testing works.
global.CanvasPattern = function CanvasPattern() {};
global.CanvasGradient = function CanvasGradient() {};

import Map from '../../src/components/map';
import MapReducer from '../../src/reducers/map';
import DrawingReducer from '../../src/reducers/drawing';

import { DRAWING } from '../../src/action-types';

let HAS_CANVAS = false;

try {
  // The import syntax cannot be used here as it
  // statically load modules during conversion,
  // require will throw the appropriate error if the module
  // is not found.
  const canvas = require('canvas');
  HAS_CANVAS = true;
} catch(err) {
  console.error('No canvas module available, skipping map-drawing tests.');
}


// without canvas a basic "does it not error out" test will
//  run fine.
describe('Map with drawing reducer', () => {
  it('creates a map with the drawing reducer', () => {
    const store = createStore(combineReducers({
        map: MapReducer,
        drawing: DrawingReducer,
    }));

    expect(mount(<Map store={store} />).contains(<div className="map" />)).toBe(true);
  });
});


// require that the canvas element be installed to run these tests.
if (HAS_CANVAS) {
  describe('Map component with drawing', () => {
    let store = null;

    beforeEach(() => {
      store = createStore(combineReducers({
        map: MapReducer,
        drawing: DrawingReducer,
      }));
    });

    it('turns on a drawing tool', () => {
      const wrapper = mount(<Map store={store} />);
      const sdk_map = wrapper.instance().getWrappedInstance();
      const ol_map = sdk_map.map;

      const n_interactions = ol_map.getInteractions().getLength();

      store.dispatch({
        type: DRAWING.START,
        interaction: 'Point',
        sourceName: 'test',
      });

      // if the drawing control has been added to the map then
      //  there should be 1 additional interaction.
      expect(ol_map.getInteractions().getLength()).toBe(n_interactions + 1);
    });

    it('turns off a drawing tool', () => {
      const wrapper = mount(<Map store={store} />);
      store.dispatch({
        type: DRAWING.START,
        interaction: 'Point',
        sourceName: 'test',
      });

      const sdk_map = wrapper.instance().getWrappedInstance();
      const ol_map = sdk_map.map;
      const n_interactions = ol_map.getInteractions().getLength();

      store.dispatch({
        type: DRAWING.END,
      });

      // The count of interactions was taken when the drawing interaction
      //  was already started.  Therefore, when the interaction ends then
      //  there should be one less interaction than at the time of observation.
      expect(ol_map.getInteractions().getLength()).toBe(n_interactions - 1);
    });
  });
}
