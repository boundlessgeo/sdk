/** Demonstrate the loading of a MapBox GL Style Spec document into SDK
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import SdkPrintReducer from '@boundlessgeo/sdk/reducers/print';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

import CONFIG from './conf'; // eslint-disable-line

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
  print: SdkPrintReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  const url = `https://api.mapbox.com/styles/v1/mapbox/bright-v8?access_token=${CONFIG.access_token}`;
  store.dispatch(mapActions.setContext({ url }));

  // place the map on the page.
  ReactDOM.render(
    <SdkMap
      accessToken={CONFIG.access_token}
      store={store}
      baseUrl={'https://api.mapbox.com/styles/v1/mapbox/bright-v8'}
    />
  , document.getElementById('map'));
}

main();
