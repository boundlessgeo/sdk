/** Demo of exporting the map to an embeddable html object.
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import SdkPrintReducer from '@boundlessgeo/sdk/reducers/print';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

import HTMLExporter from './html';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
  print: SdkPrintReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  const url = 'https://raw.githubusercontent.com/boundlessgeo/ol-mapbox-style/master/example/data/wms.json';
  store.dispatch(mapActions.setContext({ url }));

  // place the map on the page.
  ReactDOM.render(<Provider store={store}>
    <SdkMap />
  </Provider>, document.getElementById('map'));

  // add a button to demo the action.
  ReactDOM.render((
    <div>
      <h3>Try it out</h3>
      <HTMLExporter store={store}/>
    </div>
  ), document.getElementById('controls'));
}

main();
