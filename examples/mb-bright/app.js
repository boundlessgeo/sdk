/** Demonstrate the loading of a Mapbox GL Style Spec document into SDK
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';

import { connect } from 'react-redux';
import { Provider } from 'react-redux';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkZoomControl from '@boundlessgeo/sdk/components/map/zoom-control';
import SdkLegend from '@boundlessgeo/sdk/components/legend';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import SdkPrintReducer from '@boundlessgeo/sdk/reducers/print';
import SdkMapboxReducer from '@boundlessgeo/sdk/reducers/mapbox';
import * as mapActions from '@boundlessgeo/sdk/actions/map';
import * as mapboxActions from '@boundlessgeo/sdk/actions/mapbox';

// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

import CONFIG from './conf'; // eslint-disable-line

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
  print: SdkPrintReducer,
  mapbox: SdkMapboxReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

class LegendControl extends React.Component {
  render() {
    const legendItems = [];
    const layers = this.props.map.layers;
    for (let i = 0, ii = layers.length; i < ii; ++i) {
      const layer = layers[i];
      if (layer.type !== 'background') {
        legendItems.push(<div style={{display: 'flex', alignItems: 'center'}} key={i}><SdkLegend layerId={layer.id} /><span>{layer.id}</span></div>);
      }
    }
    return (<div style={{maxHeight: 200, overflow: 'auto'}}>{legendItems}</div>);
  }
}

function mapStateToProps(state) {
  return {
    map: state.map
  };
}

LegendControl = connect(mapStateToProps)(LegendControl);

function main() {
  const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/bright-v8';
  store.dispatch(mapboxActions.configure({baseUrl, accessToken: CONFIG.access_token}));

  const url = `https://api.mapbox.com/styles/v1/mapbox/bright-v8?access_token=${CONFIG.access_token}`;
  store.dispatch(mapActions.setContext({ url }));

  // place the map on the page.
  ReactDOM.render(<Provider store={store}>
    <SdkMap>
      <SdkZoomControl />
    </SdkMap>
  </Provider>, document.getElementById('map'));

  ReactDOM.render(<Provider store={store}>
    <div>
      <h4>Legend</h4>
      <LegendControl/>
    </div>
  </Provider>, document.getElementById('controls'));

}

main();
