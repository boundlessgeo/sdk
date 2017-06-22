/* global describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import intl from '../mock-i18n';
import 'phantomjs-polyfill-object-assign';
import Geolocation from '../../src/components/Geolocation';
import BoundlessSdk from '../../src/components/BoundlessSdk';
import configureStore from '../../src/stores/Store';
import '../polyfills';

describe('Geolocation', function() {
  /*TODO: Testing if a touchTap on the geolocation button will update the center
   in the state tree can be done once the addLayer functionality is
   implempented with Redux changes
  */
  // it('geolocation created on click', function() {
  //   var container = document.createElement('div');
  //   const store = configureStore();
  //   ReactDOM.render((
  //     <BoundlessSdk store={store}>
  //       <Geolocation intl={intl}/>
  //     </BoundlessSdk>
  //   ), container);
  //   var button = container.querySelector('button');
  //   const init_center = [0,0];
  //   const init_resolution = 2000;
  //   store.dispatch(setView({center: init_center, resolution: init_resolution}));
  //   TestUtils.Simulate.touchTap(button);
  //   //assert.equal(geolocation._geolocation !== undefined, true);
  //   ReactDOM.unmountComponentAtNode(container);
  // });

  it('renders the Geolocation component', function() {
    var container = document.createElement('div');
    const store = configureStore();
    ReactDOM.render((
      <div>
        <BoundlessSdk store={store}>
        <Geolocation intl={intl}/>
        </BoundlessSdk>
      </div>
    ), container);
    const actual = container.children[0].innerHTML;
    const expected = 'sdk-component geolocation';
    assert.include(actual, expected);
    ReactDOM.unmountComponentAtNode(container);
  });
});
