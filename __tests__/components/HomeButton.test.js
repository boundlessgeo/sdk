/* global describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {expect} from 'chai';
import TestUtils from 'react-addons-test-utils';
import 'phantomjs-polyfill-object-assign';
import HomeButton from '../../src/components/HomeButton';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {IntlProvider} from 'react-intl';

import configureStore from '../../src/stores/Store';
import {setView} from '../../src/actions/MapActions';

import BoundlessSdk from '../../src/components/BoundlessSdk';

import '../polyfills'; 

describe('HomeButton', function() {

  it('zooms to the correct location when home button is pressed', function() {
    var container = document.createElement('div');
    const store = configureStore();
    ReactDOM.render((
      <div>
        <IntlProvider locale="en">
        <BoundlessSdk store={store}>
          <MuiThemeProvider muiTheme={getMuiTheme()}>
            <HomeButton />
          </MuiThemeProvider>
        </BoundlessSdk>
        </IntlProvider>
      </div>
    ), container);
    var button = container.querySelector('button');


    const init_center = [0,0];
    const init_resolution = 2000;
    // set an initial view
    store.dispatch(setView({center: init_center, resolution: init_resolution}));

    // move the map
    store.dispatch(setView({center: [100, 100], resolution: 1000}));

    // "click" the button.
    TestUtils.Simulate.touchTap(button);

    let view = store.getState().mapState.view;

    // ensure the view has returned "home".
    expect(view.center).to.deep.equal(init_center);
    expect(view.resolution).to.equal(init_resolution);

    ReactDOM.unmountComponentAtNode(container);
  });

});
