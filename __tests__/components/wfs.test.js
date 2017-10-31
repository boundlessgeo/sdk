/* global it, describe, expect, afterEach, spyOn */

import { XMLSerializer, DOMParser } from 'xmldom';

import React from 'react';
import { mount, configure } from 'enzyme';
import nock from 'nock';
import  Adapter from 'enzyme-adapter-react-16';

import { createStore, combineReducers } from 'redux';

import WfsReducer from '../../src/reducers/wfs';
import WfsController from '../../src/components/wfs';
import * as actions from '../../src/actions/wfs';

configure({ adapter: new Adapter() });

// shim the browser XML functions.
window.DOMParser = DOMParser;
window.XMLSerializer = XMLSerializer;

// This is a bit of a mock, it does not perform the
// actual function but does enough to allow the rest
// of the tests below to work.
window.Node.prototype.lookupPrefix = function(uri) {
  if (uri.indexOf('wfs') > 0) {
    return 'wfs';
  }
  return null;
};

describe('WfsController component.', () => {
  let store = null;
  let feature;

  beforeEach(() => {
    feature = {
      type: 'Feature',
      id: '999',
      geometry: {
        type: 'Point',
        coordinates: [1, 1],
      },
      properties: {},
    };
    store = createStore(combineReducers({
      wfs: WfsReducer,
    }));
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('creates the controller', () => {
    mount(<WfsController store={store} />);
  });

  it('handles exception reports', (done) => {
    // eslint-disable-next-lint
    const error = '<ows:ExceptionReport xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ows="http://www.opengis.net/ows" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/ows https://demo.boundlessgeo.com/geoserver/schemas/ows/1.0.0/owsExceptionReport.xsd"><ows:Exception exceptionCode="NoApplicableCode"><ows:ExceptionText>Transaction support is not enabled</ows:ExceptionText></ows:Exception></ows:ExceptionReport>';

    let message;

    const props = {
      store,
      onRequestError: (error) => {
        message = error.message;
      },
    };

    mount(<WfsController {...props} />);

    store.dispatch(actions.addSource('exception-source', {
      onlineResource: 'http://exception.com/wfs',
      featureNS: 'http://example.com/sdk',
      featurePrefix: 'sdk',
      typeName: 'super-features',
      geometryName: 'wkb_geometry',
    }));

    nock('http://exception.com')
      .post('/wfs')
      .reply(200, error, {
        'Content-Type': 'application/xml',
      });
    store.dispatch(actions.updateFeature('exception-source', feature));

    setTimeout(() => {
      // if everything has gone well the action will no longer be in the queue
      expect(store.getState().wfs.actions).toEqual({});
      expect(message).toBe('Transaction support is not enabled');
      done();
    }, 200);
  });

  it('updates a feature', (done) => {
    // big ugly XML
    // eslint-disable-next-lint
    const response = '<wfs:TransactionResponse xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:wfs="http://www.opengis.net/wfs" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:ows="http://www.opengis.net/ows" xmlns:sdk="http://example.com/sdk" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1.0" xsi:schemaLocation="http://www.opengis.net/wfs http://localhost:3000/geoserver/schemas/wfs/1.1.0/wfs.xsd"><wfs:TransactionSummary><wfs:totalInserted>0</wfs:totalInserted><wfs:totalUpdated>1</wfs:totalUpdated><wfs:totalDeleted>0</wfs:totalDeleted></wfs:TransactionSummary><wfs:TransactionResults/><wfs:InsertResults><wfs:Feature><ogc:FeatureId fid="none"/></wfs:Feature></wfs:InsertResults></wfs:TransactionResponse>';

    const props = {
      store,
      onRequestError: () => {
      },
    };
    spyOn(props, 'onRequestError');

    mount(<WfsController {...props} />);

    store.dispatch(actions.addSource('test', {
      onlineResource: 'http://example.com/wfs',
      featureNS: 'http://example.com/sdk',
      featurePrefix: 'sdk',
      typeName: 'super-features',
    }));

    store.dispatch(actions.addSource('test2', {
      onlineResource: 'http://example.com/wfs',
      featureNS: 'http://example.com/sdk',
      featurePrefix: 'sdk',
      typeName: 'super-features',
      geometryName: 'wkb_geometry',
    }));

    store.dispatch(actions.addSource('fail-source', {
      onlineResource: 'http://fail.com/wfs',
      featureNS: 'http://example.com/sdk',
      featurePrefix: 'sdk',
      typeName: 'super-features',
      geometryName: 'wkb_geometry',
    }));

    nock('http://example.com')
      .post('/wfs')
      .reply(200, response, {
        'Content-Type': 'application/xml',
      });
    store.dispatch(actions.updateFeature('test', feature));

    // making two update calls ensures that the async handling
    // of the requests is executed properly.
    nock('http://example.com')
      .post('/wfs')
      .reply(200, response, {
        'Content-Type': 'application/xml',
      });
    store.dispatch(actions.updateFeature('test2', feature));

    nock('http://fail.com')
      .post()
      .reply(500);
    store.dispatch(actions.updateFeature('fail-source', feature));

    setTimeout(() => {
      // if everything has gone well the action will no longer be in the queue
      expect(store.getState().wfs.actions).toEqual({});
      // ensure the error handler was called.
      expect(props.onRequestError).toHaveBeenCalled();
      done();
    }, 200);
  });
});
