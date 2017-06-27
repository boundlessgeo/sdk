/* global describe, it */

import TestUtils from 'react-addons-test-utils';
import React from 'react';
import ReactDOM from 'react-dom';
import {expect} from 'chai';
import {IntlProvider} from 'react-intl';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import 'phantomjs-polyfill-object-assign';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import BoundlessSdk from '../../src/components/BoundlessSdk';
import Globe from '../../src/components/Globe';
import configureStore from '../../src/stores/Store';

import '../polyfills';

describe('Globe', function() {

  it('toggle between 2d and 3d', function() {
    var container = document.createElement('div');
    const store = configureStore();

    // render the rotate button
    ReactDOM.render((
      <div>
        <IntlProvider locale="en">
          <BoundlessSdk store={store}>
            <MuiThemeProvider muiTheme={getMuiTheme()}>
              <Globe />
            </MuiThemeProvider>
          </BoundlessSdk>
        </IntlProvider>
      </div>
    ), container);

    var buttons = container.querySelectorAll('button');
    var globe = buttons[0];

    // first touch should be 3d
    TestUtils.Simulate.touchTap(globe);
    expect(store.getState().mapState.renderer).to.equal('3d');

    // second touch should be 2d
    TestUtils.Simulate.touchTap(globe);
    expect(store.getState().mapState.renderer).to.equal('2d');

    ReactDOM.unmountComponentAtNode(container);
  });

});
