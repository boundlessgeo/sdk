/* global beforeEach, describe, it */

/* global describe, it */

import {expect} from 'chai';

import configureStore from '../../src/stores/Store';
import * as MapActions from '../../src/actions/MapActions';

describe('map reducer', function() {
  let store = null;

  beforeEach(() => {
    store = configureStore();
  });

  it('sets the rotation', () => {
    store.dispatch(MapActions.setView({rotation: -1.5}));
    expect(store.getState().mapState.view.rotation).to.equal(-1.5);
  });

  it('changes the render engine', () => {
    const engine = '3d';
    store.dispatch(MapActions.setRenderer(engine));
    expect(store.getState().mapState.renderer).to.equal(engine);
  });

});
