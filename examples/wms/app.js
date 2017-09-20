/** WMS Example.
 *
 *  Shows how to interact with a Web Mapping Service.
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import WMSCapabilitiesFormat from 'ol/format/wmscapabilities';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';
import SdkLayerList from '@boundlessgeo/sdk/components/layer-list';

import '@boundlessgeo/sdk/stylesheet/sdk.scss';
import WMSPopup from './wmspopup';
import AddWMSLayer from './addwmslayer';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  // start in the middle of america
  store.dispatch(mapActions.setView([-98, 40], 4));

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

  // retrieve GetCapabilities and give user ability to add a layer.
  const addWMS = () => {
    // this requires CORS headers on the geoserver instance.
    const url = 'https://demo.boundlessgeo.com/geoserver/wms?service=WMS&request=GetCapabilities';
    fetch(url).then(
      response => response.text(),
      error => console.error('An error occured.', error),
    )
    .then((xml) => {
      const info = new WMSCapabilitiesFormat().read(xml);
      const root = info.Capability.Layer;
      ReactDOM.render(<AddWMSLayer
        onAddLayer={(layer) => {
          // add a new source and layer
          const getMapUrl = `https://demo.boundlessgeo.com/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&SRS=EPSG:900913&LAYERS=${layer.Name}&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
          store.dispatch(mapActions.addSource(layer.Name, {
            type: 'raster',
            tileSize: 256,
            tiles: [getMapUrl],
          }));
          store.dispatch(mapActions.addLayer({
            metadata: {
              'bnd:title': layer.Title,
              'bnd:queryable': layer.queryable,
            },
            id: layer.Name,
            source: layer.Name,
          }));
        }
      }
        layers={root.Layer}
      />, document.getElementById('add-wms'));
    });
  };

  // place the map on the page.
  ReactDOM.render(<SdkMap
    includeFeaturesOnClick
    onClick={(map, xy, featuresPromise) => {
      // show a popup containing WMS GetFeatureInfo.
      featuresPromise.then((featureGroups) => {
        // setup an array for all the features returned in the promise.
        let features = [];

        // featureGroups is an array of objects. The key of each object
        // is a layer from the map.
        for (let g = 0, gg = featureGroups.length; g < gg; g++) {
          // collect every feature from each layer.
          const layers = Object.keys(featureGroups[g]);
          for (let l = 0, ll = layers.length; l < ll; l++) {
            const layer = layers[l];
            features = features.concat(featureGroups[g][layer]);
          }
        }
        if (features.length > 0) {
          map.addPopup(<WMSPopup
            coordinate={xy}
            closeable
            features={features}
          />);
        }
      });
    }}
    store={store}
  />, document.getElementById('map'));

  // add some buttons to demo some actions.
  ReactDOM.render((
    <div>
      <h3>Try it out</h3>
      <h4>Layers</h4>
      <Provider store={store}>
        <SdkLayerList />
      </Provider>
      <button onClick={addWMS}>Add WMS Layer</button>
    </div>
  ), document.getElementById('controls'));
}

main();
