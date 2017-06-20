/* global describe, it */

import TestUtils from 'react-addons-test-utils';
import React from 'react';
import ReactDOM from 'react-dom';
import {expect} from 'chai';
import {setView} from '../../src/actions/MapActions';
import 'phantomjs-polyfill-object-assign';
import ol from 'openlayers';
import intl from '../mock-i18n';
import Bookmarks from '../../src/components/Bookmarks';
import BoundlessSdk from '../../src/components/BoundlessSdk';
import configureStore from '../../src/stores/Store';
import '../polyfills';
import {IntlProvider} from 'react-intl';


describe('Bookmarks', function() {
  var bookmarks = [{
    name: 'Le Grenier Pain',
    description: '<b>Address: </b>38 rue des Abbesses<br><b>Telephone:</b> 33 (0)1 46 06 41 81<br><a href="http://www.legrenierapain.com">Website</a>',
    extent: [259562.7661267497, 6254560.095662868, 260675.9610346824, 6256252.988234103],
    center: ol.extent.getCenter([259562.7661267497, 6254560.095662868, 260675.9610346824, 6256252.988234103]),
    resolution: 10
  }, {
    name: 'Poilne',
    description: '<b>Address: </b>8 rue du Cherche-Midi<br><b>Telephone:</b> 33 (0)1 45 48 42 59<br><a href="http://www.poilane.fr">Website</a>',
    extent: [258703.71361629796, 6248811.5276565505, 259816.90852423065, 6250503.271278702],
    center: ol.extent.getCenter([258703.71361629796, 6248811.5276565505, 259816.90852423065, 6250503.271278702]),
    resolution: 15
  }];

  it('zooms to the next bookmark', function(done) {
    var container = document.createElement('div');
    const store = configureStore();
    ReactDOM.render((
      <div>
        <IntlProvider locale="en">
          <BoundlessSdk store={store}>
              <Bookmarks intl={intl} bookmarks={bookmarks}/>
          </BoundlessSdk>
        </IntlProvider>
      </div>
    ), container);

    store.dispatch(setView({center: [0,0], resolution:100}));
    expect(store.getState().mapState.view.center[0]).to.equal(0);
    expect(store.getState().mapState.view.center[1]).to.equal(0);
    expect(store.getState().mapState.view.resolution).to.equal(100);

    var next = container.querySelector('div.navNext');
    TestUtils.SimulateNative.click(next);
    expect(store.getState().mapState.view.center[0]).to.equal(260119.36358071605);
    expect(store.getState().mapState.view.center[1]).to.equal(6255406.541948485);
    expect(store.getState().mapState.view.resolution).to.equal(10);
    TestUtils.SimulateNative.click(next);
    expect(store.getState().mapState.view.center[0]).to.equal(259260.31107026432);
    expect(store.getState().mapState.view.center[1]).to.equal(6249657.399467627);
    expect(store.getState().mapState.view.resolution).to.equal(15);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

  it('zooms to the next bookmark using nav dots', function(done) {
    var container = document.createElement('div');
    const store = configureStore();

    ReactDOM.render((
      <div>
        <IntlProvider locale="en">
          <BoundlessSdk store={store}>
              <Bookmarks intl={intl} bookmarks={bookmarks}/>
          </BoundlessSdk>
        </IntlProvider>
      </div>
    ), container);

    store.dispatch(setView({center: [0,0], resolution:100}));
    expect(store.getState().mapState.view.center[0]).to.equal(0);
    expect(store.getState().mapState.view.center[1]).to.equal(0);
    expect(store.getState().mapState.view.resolution).to.equal(100);
    var buttonOne = container.querySelector('button#dots_1');
    TestUtils.SimulateNative.click(buttonOne);
    expect(store.getState().mapState.view.center[0]).to.equal(260119.36358071605);
    expect(store.getState().mapState.view.center[1]).to.equal(6255406.541948485);
    expect(store.getState().mapState.view.resolution).to.equal(10);
    var buttonTwo = container.querySelector('button#dots_2');
    TestUtils.SimulateNative.click(buttonTwo);
    expect(store.getState().mapState.view.center[0]).to.equal(259260.31107026432);
    expect(store.getState().mapState.view.center[1]).to.equal(6249657.399467627);
    expect(store.getState().mapState.view.resolution).to.equal(15);
    window.setTimeout(function() {
      ReactDOM.unmountComponentAtNode(container);
      done();
    }, 500);
  });

});
