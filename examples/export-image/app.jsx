/* global saveAs */
/** Demo of using the drawing, modify, and select interactions.
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
import * as printActions from '@boundlessgeo/sdk/actions/print';

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

  const exportMapImage = (blob) => {
    saveAs(blob, 'map.png');
    store.dispatch(printActions.receiveMapImage());
  };

  // place the map on the page.
  ReactDOM.render(
    <SdkMap
      store={store}
      onExportImage={exportMapImage}
    />
  , document.getElementById('map'));

  // called by the onExportImage prop of the SdkMap.
  const exportImage = () => {
    store.dispatch(printActions.exportMapImage());
  };

  // add a button to demo the action.
  ReactDOM.render((
    <div>
      <button className="sdk-btn" onClick={exportImage}>Export map image</button>
    </div>
  ), document.getElementById('controls'));
}

main();
