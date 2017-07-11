/** Very basic SDK application example.
 *
 *  Contains a Map and demonstrates some of the dynamics of
 *  using the store.
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

import '@boundlessgeo/sdk/stylesheet/sdk.css';


class LayerCheckboxComponent extends React.Component {

  // TODO: Move this to map actions
  isLayerVisible(layerId) {
    const state = this.props.map;

    for (let i = 0, ii = state.layers.length; i < ii; i++) { 
      if (state.layers[i].id === layerId) {
        const layer = state.layers[i];
        if (typeof layer.layout !== 'undefined') {
          return (layer.layout.visibility !== 'none');
        } else {
          return true;
        }
      }
    }

    // just assume the layer is off if it's not found.
    return false;
  }

  toggleVisibility(shown) {
    store.dispatch(mapActions.setLayerVisibility(this.props.layerId, shown ? 'none' : 'visible'));
  }


  render() {
    const is_checked = this.isLayerVisible(this.props.layerId);
    return (
      <div>
        <input type='checkbox' onChange={ () => { }}
          onClick={() => { this.toggleVisibility(is_checked); }} 
          checked={is_checked} />
        { this.props.label }
      </div>
    )
  }
}

const LayerCheckbox = connect((state) => { return {map: state.map}})(LayerCheckboxComponent);

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  // start in the middle of america
  store.dispatch(mapActions.setView([-10895923.706980927, 4656189.67701237], 4));

  // add the OSM source
  store.dispatch(mapActions.addSource('osm', {
    type: 'raster',
    tileSize: 256,
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
  }));

  // and an OSM layer.
  store.dispatch(mapActions.addLayer({
    id: 'osm',
    source: 'osm',
  }));

  // set the background color.
 store.dispatch(mapActions.addLayer({
    id: 'background',
    type: 'background',
    paint: {
      'background-color': '#eee',
    },
  }));

  // add the wms source
  store.dispatch(mapActions.addSource('states', {
    type: 'raster',
    tileSize: 256,
    tiles: ['https://ahocevar.com/geoserver/gwc/service/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&SRS=EPSG:900913&LAYERS=topp:states&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}'],
  }));

  // add the wms layer
  store.dispatch(mapActions.addLayer({
    id: 'states',
    source: 'states',
  }));

  const toggleVisibility = (shown) => {
  };

  // place the map on the page.
  ReactDOM.render(<SdkMap store={store} />, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <h4>Layers</h4>
      <LayerCheckbox store={store} layerId={'states'} label='U.S. States' />
    </div>
  ), document.getElementById('controls'));
}

main();
