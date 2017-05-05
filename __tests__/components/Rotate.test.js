/* global afterEach, beforeEach, describe, it */

import TestUtils from 'react-addons-test-utils';
import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import raf from 'raf';
import ol from 'openlayers';
import intl from '../mock-i18n';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import 'phantomjs-polyfill-object-assign';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Rotate from '../../src/components/Rotate';

raf.polyfill();

describe('Rotate', function() {
  var target, map;
  var width = 360;
  var height = 180;

  beforeEach(function(done) {
    target = document.createElement('div');
    var style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = width + 'px';
    style.height = height + 'px';
    document.body.appendChild(target);
    map = new ol.Map({
      target: target,
      view: new ol.View({
        center: [0, 0],
        zoom: 1,
        rotation: 0.1
      })
    });
    map.once('postrender', function() {
      done();
    });
  });

  afterEach(function() {
    map.setTarget(null);
    document.body.removeChild(target);
  });

  it('rotates the map back to north', function(done) {
    var container = document.createElement('div');
    ReactDOM.render((
      <MuiThemeProvider muiTheme={getMuiTheme()}>
        <Rotate intl={intl} map={map} />
      </MuiThemeProvider>
    ), container);
    var buttons = container.querySelectorAll('button');
    var rotate = buttons[0];
    assert.equal(map.getView().getRotation(), 0.1);
    TestUtils.Simulate.touchTap(rotate);
    window.setTimeout(function() {
      assert.equal(Math.round(map.getView().getRotation()), 0);
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 1000);
  });

  it('renders the rotate component', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<Rotate intl={intl} map={map} autoHide={false}/>);
    const actual = renderer.getRenderOutput().props.className;
    const expected = 'sdk-component rotate';
    assert.equal(actual, expected);
  });

});
