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
import ol from 'openlayers';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import classNames from 'classnames';
import Snackbar from 'material-ui/Snackbar';
import Button from './Button';
import MyLocation from 'material-ui/svg-icons/maps/my-location';

const messages = defineMessages({
  error: {
    id: 'geolocation.error',
    description: 'Error text for when geolocation fails',
    defaultMessage: 'Error while retrieving geolocation, details: {details}'
  },
  buttontitle: {
    id: 'geolocation.buttontitle',
    description: 'Title for geolocation button',
    defaultMessage: 'Geolocation'
  },
  trackingtitle: {
    id: 'geolocation.trackingtitle',
    description: 'Title to add to the geolocation button when tracking is active',
    defaultMessage: 'Tracking'
  }
});

/**
 * Enable geolocation which uses the current position of the user in the map.
 * Can show the current position on the map, and also track the position.
 *
 * ```xml
 * <Geolocation map={map} />
 * ```
 * ![Geolocation button](../Geolocation.png)
 * ![Geolocation tracking mode](../Geolocation_tracking.png)
 * ![Geolocation marker](../Geolocation_marker.png)
 *
 */
class Geolocation extends React.PureComponent {
  static propTypes = {
    /**
     * The ol3 map for which to change its view's center.
     */
    map: React.PropTypes.instanceOf(ol.Map).isRequired,
    /**
     * Position of the tooltip.
     */
    tooltipPosition: React.PropTypes.oneOf(['bottom', 'bottom-right', 'bottom-left', 'right', 'left', 'top-right', 'top', 'top-left']),
    /**
     * The zoom level used when centering the view.
     */
    zoom: React.PropTypes.number,
    /**
     * Style for the button.
     */
    style: React.PropTypes.object,
    /**
     * Css class name to apply on the root element of this component.
     */
    className: React.PropTypes.string,
    /**
     * @ignore
     */
    intl: intlShape.isRequired
  };

  static contextTypes = {
    muiTheme: React.PropTypes.object
  };

  static childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired
  };

  constructor(props, context) {
    super(props);
    this.state = {
      muiTheme: context.muiTheme || getMuiTheme(),
      error: false,
      open: false,
      tracking: false
    };
  }
  getChildContext() {
    return {muiTheme: this.state.muiTheme};
  }
  _geolocate() {
    var map = this.props.map;
    var view = map.getView();
    if (this._geolocation) {
      this._geolocation.setTracking(!this._geolocation.getTracking());
      if (this._geolocation.getTracking()) {
        this._hasBeenCentered = false;
      }
      this._featuresOverlay.getSource().clear();
      this._featuresOverlay.setVisible(this._geolocation.getTracking());
    } else {
      this._geolocation = new ol.Geolocation({
        tracking: true,
        projection: view.getProjection()
      });
      var accuracyFeature = new ol.Feature();
      this._geolocation.on('change:accuracyGeometry', function() {
        accuracyFeature.setGeometry(this._geolocation.getAccuracyGeometry());
        this._featuresOverlay.getSource().addFeature(accuracyFeature);
      }, this);
      var positionFeature = new ol.Feature();
      positionFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: '#3399CC'
          }),
          stroke: new ol.style.Stroke({
            color: '#fff',
            width: 2
          })
        })
      }));
      this._geolocation.on('error', function(error) {
        this.setState({error: true, open: true, msg: error.message});
      }, this);
      this._geolocation.on('change:position', function() {
        var coordinates = this._geolocation.getPosition();
        positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
        this._featuresOverlay.getSource().addFeature(positionFeature);
        if (!this._hasBeenCentered) {
          view.setCenter(coordinates);
          if (this.props.zoom !== undefined) {
            view.setZoom(this.props.zoom);
          }
          this._hasBeenCentered = true;
        }
      }, this);
      this._featuresOverlay = new ol.layer.Vector({
        title: null,
        zIndex: 1000,
        source: new ol.source.Vector({wrapX: false})
      });
      map.addLayer(this._featuresOverlay);
    }
    this.setState({tracking: this._geolocation.getTracking()});
  }
  _handleRequestClose() {
    this.setState({
      open: false
    });
  }
  render() {
    const {formatMessage} = this.props.intl;
    if (this.state.error) {
      return (<Snackbar
        open={this.state.open}
        message={formatMessage(messages.error, {details: this.state.msg})}
        autoHideDuration={2000}
        onRequestClose={this._handleRequestClose.bind(this)}
      />);
    } else {
      var iconStyle, tooltip = formatMessage(messages.buttontitle);
      if (this.state.tracking) {
        iconStyle = {
          fill: this.state.muiTheme.rawTheme.palette.active1Color
        };
        tooltip += ' (' + formatMessage(messages.trackingtitle) + ')';
      }
      return (
        <Button tooltipPosition={this.props.tooltipPosition} iconStyle={iconStyle} buttonType='Action' mini={true} secondary={true} className={classNames('sdk-component geolocation', this.props.className)} tooltip={tooltip} onTouchTap={this._geolocate.bind(this)}><MyLocation /></Button>
      );
    }
  }
}

export default injectIntl(Geolocation);
