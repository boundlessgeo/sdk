/** Demo of bookmarks zooming between points in an SDK map.
 *  Custom Open Layer Controls are added
 *
 */

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import React from 'react';
import ReactDOM from 'react-dom';
import fetch from 'isomorphic-fetch';

import SdkMap from '@boundlessgeo/sdk/components/map';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

import BookmarkComponent from './bookmarks';
import MoveButtonComponent from './moveButton';
import AddBookmarkComponent from './addBookmark';

import bookmarkReducer from './reducer';
import * as bookmarkAction from './action';


// This will have webpack include all of the SDK styles.
import '@boundlessgeo/sdk/stylesheet/sdk.scss';

/* eslint-disable no-underscore-dangle */
const store = createStore(combineReducers({
  map: SdkMapReducer, bookmark: bookmarkReducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
   applyMiddleware(thunkMiddleware));

function main() {
  // load in the map style from a external .json
  store.dispatch(mapActions.setContext({url:'./bookmarks.json'}));

  // This is the name of the source that the bookmark component will iterate over
  const SOURCENAMES = ['paris-bakeries', 'saint-louis-bakeries'];

  // Fetch the geoJson file from a url and add it to the map at the named source
  const addDataFromGeoJSON = (url, sourceName) => {
    // Fetch URL
    return fetch(url)
      .then(
        response => response.json(),
        error => console.error('An error occured.', error),
      )
      // addFeatures with the features, source name
      // .then(json => store.dispatch(mapActions.addFeatures(sourceName, json)));
      .then(json => {
        store.dispatch(mapActions.addSource(sourceName, {
          type: 'geojson',
          data: json
        }));
        store.dispatch(mapActions.addLayer({
          id: sourceName,
          source: sourceName,
          paint: {
            'circle-radius': 5,
            'circle-color': '#f46b42',
            'circle-stroke-color': '#3a160b',
          }
        }));
      });
  };

  // Change the souce as needed
  const changeSource = (sourceName) => {
    store.dispatch(bookmarkAction.changeSource(sourceName));
  }
  // Add bookmark to redux store
  const addBookmark = () => {
    store.dispatch(bookmarkAction.addBookmark(true));
  }
  // Delete bookmark to redux store
  const deleteBookmark = () => {
    const bookmark = store.getState().bookmark;
    const features = store.getState().map.sources[bookmark.source].data.features;

    // Simple check to make sure we have more feature to remove
    if( features.length > 0 ) {

      // move to the next feature before it's deleted
      if( features.length > 1) {
        store.dispatch(mapActions.setView(features[bookmark.count + 1].geometry.coordinates, 18))
      }

      // Assumes address is unique
      // In a larger dataset adding in a uuid would be a good idea
      const filter = ['==', 'address', features[bookmark.count].properties.address];
      store.dispatch(mapActions.removeFeatures(bookmark.source, filter));
    } else {
      alert("No features left to delete");
    }
  }

  // Fetch data from local files
  addDataFromGeoJSON('./data/stlouis.json', SOURCENAMES[1]);
  addDataFromGeoJSON('./data/paris.json', SOURCENAMES[0]);


  // Init source for the bookmarks
  changeSource(SOURCENAMES[0]);
  //this.props.zoomTo(feature.geometry.coordinates, 18);

  // place the map on the page
  ReactDOM.render(<SdkMap className='map-container' store={store}/>,
    document.getElementById('map'));

  // place the bookmark control and pass in the features and zoom function
  ReactDOM.render(<BookmarkComponent className='bookmark-item' store={store}/>,
    document.getElementById('bookmark'));

  // place the bookmark control and pass in the features and zoom function
  ReactDOM.render(<AddBookmarkComponent store={store}/>,
    document.getElementById('addForm'));

  // place the move slide compoent, same slide used in bookmark component
  ReactDOM.render(
    (<div>
        <button className="sdk-btn" onClick={() => {changeSource(SOURCENAMES[1])} }  >St. Louis Bakeries</button>
        <button className="sdk-btn" onClick={() => {changeSource(SOURCENAMES[0])} }  >Paris Bakeries</button>
        <button className="sdk-btn" onClick={() => {addBookmark()} }  >Add Bookmark</button>
        <button className="sdk-btn" onClick={() => {deleteBookmark()} }  >Delete Bookmark</button>
        <MoveButtonComponent className="sdk-btn" store={store}/>
      </div>),
      document.getElementById('controls'));
}
main();
