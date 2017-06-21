/* global describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {IntlProvider} from 'react-intl';

import BoundlessSdk from '../../src/components/BoundlessSdk';

import '../polyfills';

import Geocoding from '../../src/components/Geocoding';

describe('Geocoding', function() {

  it('renders the search input field', function() {
    var container = document.createElement('div');
    ReactDOM.render((
      <div>
        <IntlProvider locale="en">
        <BoundlessSdk>
          <MuiThemeProvider muiTheme={getMuiTheme()}>
            <Geocoding />
          </MuiThemeProvider>
        </BoundlessSdk>
        </IntlProvider>
      </div>
    ), container);

    var inputs = container.querySelectorAll('input');
    assert.equal(inputs.length, 1);
    ReactDOM.unmountComponentAtNode(container);
  });

});
