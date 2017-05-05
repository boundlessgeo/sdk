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
import Zoom from '../../src/components/Zoom';

raf.polyfill();

describe('Zoom', function() {
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
        zoom: 1
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

  it('zooms in', function(done) {
    var container = document.createElement('div');
    ReactDOM.render((
      <MuiThemeProvider muiTheme={getMuiTheme()}>
        <Zoom intl={intl} map={map} />
      </MuiThemeProvider>
    ), container);
    var buttons = container.querySelectorAll('button');
    var zoomin = buttons[0];
    assert.equal(map.getView().getZoom(), 1);
    assert.equal(map.getView().getCenter()[0], 0);
    assert.equal(map.getView().getCenter()[1], 0);
    TestUtils.Simulate.touchTap(zoomin);
    window.setTimeout(function() {
      assert.equal(Math.round(map.getView().getZoom()), 2);
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 1000);
  });

  it('renders the zoom buttons', function() {
    const renderer = TestUtils.createRenderer();
    renderer.render(<Zoom intl={intl} map={map}/>);
    const actual = renderer.getRenderOutput().props.className;
    const expected = 'sdk-component zoom';
    assert.equal(actual, expected);
  });

});
