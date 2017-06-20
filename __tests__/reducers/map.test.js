/* global describe, it */

/* global describe, it */

import {expect} from 'chai';

import configureStore from '../../src/stores/Store';
import * as MapActions from '../../src/actions/MapActions';

describe('map reducer', function() {

  it('sets the rotation', () => {
    const store = configureStore();
    store.dispatch(MapActions.setView({rotation: -1.5}));
    expect(store.getState().mapState.view.rotation).to.equal(-1.5);
  });

});
