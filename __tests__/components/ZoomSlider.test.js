/* global describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import configureStore from '../../src/stores/Store';
import 'phantomjs-polyfill-object-assign';
import ZoomSlider from '../../src/components/ZoomSlider';
import BoundlessSdk from '../../src/components/BoundlessSdk';
import {IntlProvider} from 'react-intl';
import '../polyfills';

describe('ZoomSlider', function() {

  it('renders the ZoomSlider', function() {
    var container = document.createElement('div');
    const store = configureStore();
    ReactDOM.render((
      <div>
        <IntlProvider locale="en">
          <BoundlessSdk store={store}>
            <ZoomSlider />
          </BoundlessSdk>
        </IntlProvider>
      </div>
    ), container);
    assert.include(container.children[0].innerHTML, 'sdk-component zoom-slider')
    ReactDOM.unmountComponentAtNode(container);
  });

});
