/* global it, describe, expect, beforeEach, spyOn */

/** Specific tests for map interactions.
 *
 *  This is *not* intended to be a complete test of the map,
 *  it only tests the drawing related functionality. See map.test.jsx
 *  for a more complete test of the map component.
 *
 */

import React from 'react';
import { mount } from 'enzyme';

import { createStore, combineReducers } from 'redux';

import Feature from 'ol/feature';
import Point from 'ol/geom/point';

import SdkMap from '../../src/components/map';
import MapReducer from '../../src/reducers/map';
import DrawingReducer from '../../src/reducers/drawing';

import * as MapActions from '../../src/actions/map';

import { INTERACTIONS } from '../../src/constants';
import { DRAWING } from '../../src/action-types';


// jsdom / enzyme / jest will include <canvas> support
// but not the full API, this dummys the CanvasPattern
// and CanvasGradient objects so that OL testing works.
global.CanvasPattern = function CanvasPattern() {};
global.CanvasGradient = function CanvasGradient() {};

let HAS_CANVAS = false;

try {
  // The import syntax cannot be used here as it
  // statically load modules during conversion,
  // require will throw the appropriate error if the module
  // is not found.
  HAS_CANVAS = (typeof require('canvas') !== 'undefined'); // eslint-disable-line global-require
} catch (err) {
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

    expect(mount(<SdkMap store={store} />).contains(<div className="map" />)).toBe(true);
  });
});


// require that the canvas element be installed to run these tests.
if (HAS_CANVAS) {
  describe('Map component with drawing', () => {
    let store = null;
    let wrapper = null;

    beforeEach(() => {
      store = createStore(combineReducers({
        map: MapReducer,
        drawing: DrawingReducer,
      }));

      store.dispatch(MapActions.addSource('test', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: { },
          }],
        },
      }));

      store.dispatch(MapActions.addLayer({
        id: 'points',
        source: 'test',
        type: 'circle',
        paint: {
          'circle-radius': 5,
        },
      }));

      wrapper = mount(<SdkMap store={store} />);
    });

    it('turns on a drawing tool', () => {
      const sdk_map = wrapper.instance().getWrappedInstance();
      const ol_map = sdk_map.map;
      const n_interactions = ol_map.getInteractions().getLength();

      store.dispatch({
        type: DRAWING.START,
        interaction: INTERACTIONS.point,
        sourceName: 'test',
      });

      // if the drawing control has been added to the map then
      //  there should be 1 additional interaction.
      expect(ol_map.getInteractions().getLength()).toBe(n_interactions + 1);

      // get the last interaction, which should be the drawing interaction
      const draw = ol_map.getInteractions().item(n_interactions);

      const dummy_feature = new Feature();
      dummy_feature.setGeometry(new Point(5, 5));
      draw.dispatchEvent({
        type: 'drawend',
        feature: dummy_feature,
      });

      store.dispatch(MapActions.setView([-45, -45], 11));
    });

    it('turns off a drawing tool', () => {
      store.dispatch({
        type: DRAWING.START,
        interaction: INTERACTIONS.point,
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

    it('turns on feature modification', () => {
      const sdk_map = wrapper.instance().getWrappedInstance();
      const ol_map = sdk_map.map;

      const interactions = ol_map.getInteractions();
      const n_interactions = interactions.getLength();

      store.dispatch({
        type: DRAWING.START,
        interaction: INTERACTIONS.modify,
        sourceName: 'test',
      });

      // modify differs from select and drawing tools
      //  as it requires adding two interactions to the map.
      expect(interactions.getLength()).toBe(n_interactions + 2);

      // get the modify interaction
      const select = interactions.item(interactions.getLength() - 2);
      const modify = interactions.item(interactions.getLength() - 1);

      // configure a spy, when a feature is modified onFeatureEvent
      //  should be called.
      spyOn(sdk_map, 'onFeatureEvent');

      // fake modifying a sample feature.
      const features = sdk_map.layers.points.getSource().getFeatures();
      select.getFeatures().push(features[0]);

      modify.dispatchEvent({
        type: 'modifyend',
        features: select.getFeatures(),
      });

      // ensure onFeatureEvent was called.
      expect(sdk_map.onFeatureEvent).toHaveBeenCalled();
    });

    it('turns on select', () => {
      const sdk_map = wrapper.instance().getWrappedInstance();
      const ol_map = sdk_map.map;

      const n_interactions = ol_map.getInteractions().getLength();

      // kick-off the select interaction.
      store.dispatch({
        type: DRAWING.START,
        interaction: INTERACTIONS.select,
        sourceName: 'test',
      });

      // ensure the interaction has been added to the map.
      const interactions = ol_map.getInteractions();
      expect(interactions.getLength()).toBe(n_interactions + 1);

      // get the select interaction
      const select = interactions.item(interactions.getLength() - 1);

      // configure a spy, when a feature is selected onFeatureEvent
      //  should be called.
      spyOn(sdk_map, 'onFeatureEvent');

      // fake selecting a sample feature.
      const features = sdk_map.layers.points.getSource().getFeatures();
      select.getFeatures().push(features[0]);
      select.dispatchEvent({
        type: 'select',
      });

      // ensure onFeatureEvent was called.
      expect(sdk_map.onFeatureEvent).toHaveBeenCalled();
    });
  });
}
