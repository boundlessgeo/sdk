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
import Dialog from 'material-ui/Dialog';
import Button from './Button';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import BaseMapConfigService from '../services/BaseMapConfigService';
import {intlShape, defineMessages, injectIntl} from 'react-intl';
import {GridList, GridTile} from 'material-ui/GridList';

const messages = defineMessages({
  title: {
    id: 'basemapmodal.title',
    description: 'Title for the base map modal dialog',
    defaultMessage: 'Select a basemap'
  },
  closebutton: {
    id: 'basemapmodal.closebutton',
    description: 'Text for the close button',
    defaultMessage: 'Close'
  }
});

class BaseMapModal extends React.Component {
  static propTypes = {
    /**
     * The OpenLayers Map.
     */
    map: React.PropTypes.instanceOf(ol.Map),
    /**
     * Tile services to display as options in this dialog.
     */
    tileServices: React.PropTypes.arrayOf(React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      description: React.PropTypes.string.isRequired,
      endpoint: React.PropTypes.string,
      standard: React.PropTypes.string.isRequired,
      attribution: React.PropTypes.string,
      thumbnail: React.PropTypes.string.isRequired
    })),
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

  static defaultProps = {
    tileServices: [{
      name: 'osm',
      description: 'OSM Streets',
      standard: 'OSM',
      thumbnail: 'https://a.tile.openstreetmap.org/0/0/0.png'
    }, {
      name: 'light_all',
      description: 'CartoDB light',
      endpoint: 'http://s.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      standard: 'XYZ',
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      thumbnail: 'http://s.basemaps.cartocdn.com/light_all/0/0/0.png'
    }, {
      name: 'dark_all',
      description: 'CartoDB dark',
      endpoint: 'http://s.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      standard: 'XYZ',
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      thumbnail: 'http://s.basemaps.cartocdn.com/dark_all/0/0/0.png'
    }, {
      name: 'World_Imagery',
      description: 'ESRI world imagery',
      endpoint: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      standard: 'XYZ',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      thumbnail: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/0/0/0'
    }]
  };

  constructor(props, context) {
    super(props);
    this._muiTheme = context.muiTheme || getMuiTheme();
    this.state = {
      open: false
    };
  }
  getChildContext() {
    return {muiTheme: this._muiTheme};
  }
  close() {
    this.setState({open: false});
  }
  open() {
    this.setState({open: true});
  }
  _tileClick(tileService) {
    var foundGroup = false;
    var map = this.props.map;
    var olLayer = BaseMapConfigService.createLayer(tileService);
    map.getLayers().forEach(function(lyr) {
      if (foundGroup === false && lyr.get('type') === 'base-group') {
        foundGroup = true;
        lyr.getLayers().forEach(function(child) {
          child.setVisible(false);
        });
        lyr.getLayers().push(olLayer);
      }
    });
    if (foundGroup === false) {
      // look for a layer with type base and replace that
      map.getLayers().forEach(function(lyr) {
        if (lyr.get('type') === 'base') {
          map.removeLayer(lyr);
        }
      });
      map.getLayers().insertAt(0, olLayer);
    }
  }
  render() {
    const {formatMessage} = this.props.intl;
    var actions = [
      <Button buttonType='Flat' label={formatMessage(messages.closebutton)} onTouchTap={this.close.bind(this)} />
    ];
    return (<Dialog autoScrollBodyContent={true} actions={actions} title={formatMessage(messages.title)} modal={true} open={this.state.open} onRequestClose={this.close.bind(this)}>
      <GridList cols={2} cellHeight={120}>
        {this.props.tileServices.map((tileService) => (
          <GridTile style={{cursor: 'pointer'}} onTouchTap={this._tileClick.bind(this, tileService)}
            key={tileService.name}
            title={tileService.description}>
            <img src={tileService.thumbnail} />
          </GridTile>
        ))}
      </GridList>
    </Dialog>);
  }
}

export default injectIntl(BaseMapModal, {withRef: true});
