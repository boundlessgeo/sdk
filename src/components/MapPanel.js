/*
 * Copyright 2015-present Boundless Spatial Inc., http://boundlessgeo.com
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import LayerStore from '../stores/LayerStore';
import Snackbar from 'material-ui/Snackbar';
import ol from 'openlayers';
import './MapPanel.css';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

const messages = defineMessages({
  errormsg: {
    id: 'layerlist.errormsg',
    description: 'Error message if loading tiles / images fails',
    defaultMessage: 'There was an error loading tiles.'
  }
});

/**
 * A div that can render the OpenLayers map object. It will also take care of notifying the user of load errors.
 * It can also provide integration with the browser's back and forward button for extent history navigation.
 *
 * ```xml
 * <MapPanel id='map' map={map} />
 * ```
 */
class MapPanel extends React.Component {
  static propTypes = {
    /**
     * The map to use for this map panel.
     */
    map: React.PropTypes.instanceOf(ol.Map).isRequired,
    /**
     * Identifier of the map div.
     */
    id: React.PropTypes.string,
    /**
     * Css class name to apply on the map div.
     */
    className: React.PropTypes.string,
    /**
     * Extent to fit on the map initially.
     */
    extent: React.PropTypes.arrayOf(React.PropTypes.number),
    /**
     * Use the back and forward buttons of the browser for navigation history.
     */
    useHistory: React.PropTypes.bool,
    /**
     * @ignore
     */
    children: React.PropTypes.node,
    /**
    * @ignore
    */
    intl: intlShape.isRequired
  };

  static contextTypes = {
    proxy: React.PropTypes.string,
    requestHeaders: React.PropTypes.object
  };

  static defaultProps = {
    useHistory: true
  };

  constructor(props, context) {
    super(props);
    this.state = {
      error: false,
      open: false
    };
    this._proxy = context.proxy;
    this._requestHeaders = context.requestHeaders;
    LayerStore.bindMap(this.props.map, this._proxy, this._requestHeaders);
  }
  componentWillMount() {
    this._onErrorCb = this._onError.bind(this);
    LayerStore.addErrorListener(this._onErrorCb);
  }
  componentDidMount() {
    var map = this.props.map;
    map.setTarget(ReactDOM.findDOMNode(this.refs.map));
    if (this.props.useHistory) {
      this._initViewFromHash();
      this._shouldUpdate = true;
      map.on('moveend', this._updatePermalink, this);
      // restore the view state when navigating through the history, see
      // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
      this._onPopState = this._onPopState.bind(this);
      global.addEventListener('popstate', this._onPopState);
    } else if (this.props.extent) {
      map.getView().fit(this.props.extent, this.props.map.getSize(), {constrainResolution: false});
    }
  }
  componentWillUnmount() {
    LayerStore.removeErrorListener(this._onErrorCb);
    if (this.props.useHistory) {
      global.removeEventListener('popstate', this._onPopState);
    }
  }
  _onPopState(event) {
    if (event.state === null) {
      return;
    }
    var view = this.props.map.getView();
    view.setCenter(event.state.center);
    view.setResolution(event.state.resolution);
    view.setRotation(event.state.rotation);
    this._shouldUpdate = false;
  }
  _updatePermalink() {
    if (!this._shouldUpdate) {
      // do not update the URL when the view was changed in the 'popstate' handler
      this._shouldUpdate = true;
      return;
    }
    var view = this.props.map.getView();
    var center = view.getCenter();
    var hash = '#map=' +
      view.getResolution() + '/' +
      Math.round(center[0] * 100) / 100 + '/' +
      Math.round(center[1] * 100) / 100 + '/' +
      view.getRotation();
    var state = {
      resolution: view.getResolution(),
      center: view.getCenter(),
      rotation: view.getRotation()
    };
    global.history.pushState(state, 'map', hash);
  }
  _initViewFromHash() {
    var view = this.props.map.getView();
    if (global.location.hash !== '') {
      var hash = global.location.hash.replace('#map=', '');
      var parts = hash.split('/');
      if (parts.length === 4) {
        var resolution = parseFloat(parts[0]);
        var center = [
          parseFloat(parts[1]),
          parseFloat(parts[2])
        ];
        var rotation = parseFloat(parts[3]);
        view.setResolution(resolution);
        view.setCenter(center);
        view.setRotation(rotation);
      }
    } else if (this.props.extent) {
      view.fit(this.props.extent, this.props.map.getSize(), {constrainResolution: false});
    }
  }
  _onError() {
    if (this._proxy) {
      // ignore the first error
      if (this.error === true) {
        this.setState({open: true, error: true});
      }
    } else {
      this.setState({open: true, error: true});
    }
    this._error = true;
  }
  _handleRequestClose() {
    this.setState({
      open: false
    });
  }
  render() {
    const {formatMessage} = this.props.intl;
    var error;
    if (this.state.error === true) {
      error = (<Snackbar
        open={this.state.open}
        message={formatMessage(messages.errormsg)}
        autoHideDuration={2000}
        onRequestClose={this._handleRequestClose.bind(this)}
      />);
    }
    return (
      <div id={this.props.id} ref='map' className={classNames('sdk-component map-panel', this.props.className)}>{error}{this.props.children}</div>
    );
  }
}

export default injectIntl(MapPanel);
