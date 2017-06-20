/* global describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import intl from '../mock-i18n';
import ZoomToLatLon from '../../src/components/ZoomToLatLonView';
import TestUtils from 'react-addons-test-utils';
import '../polyfills';


describe('ZoomToLatLon', function() {

  it('transforms DMS to DD', function(done) {
    var container = document.createElement('div');
    var comp = ReactDOM.render((
      <ZoomToLatLon intl={intl} />
    ), container);
    var dd = comp._dmsToDegrees(60, 10, 5, 'N');
    assert.equal(dd, 60.168055555555554);
    dd = comp._dmsToDegrees(60, 10, 5, 'S');
    assert.equal(dd, -60.168055555555554);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('renders the zoom component', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<ZoomToLatLon intl={intl}/>);
    const actual = renderer.getRenderOutput().props.children[0].props.className;
    const expected = 'sdk-component zoom-to-latlon';
    assert.equal(actual, expected);
  });

});
