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

/* eslint react/prop-types: 0 */
import React from 'react';
import ReactDOM from 'react-dom';
import Dialog from 'material-ui/Dialog';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import TextField from 'material-ui/TextField';
import AppDispatcher from '../dispatchers/AppDispatcher';
import ToolUtil from '../toolutil';
import LayerConstants from '../constants/LayerConstants';
import MenuItem from 'material-ui/MenuItem';
import SelectField from 'material-ui/SelectField';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import Button from './Button';
import ol from 'openlayers';
import util from '../util';
import ColorPicker from 'react-color';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import Paper from 'material-ui/Paper';

const NEW_ATTR_PREFIX = 'new-attr-';
const ID_PREFIX = 'sdk-edit-';

const messages = defineMessages({
  enable: {
    id: 'edit.enable',
    description: 'Button text to enable edit mode',
    defaultMessage: 'Enable'
  },
  enabletitle: {
    id: 'edit.enabletitle',
    description: 'Button tooltip to enable edit mode',
    defaultMessage: 'Enable edit mode'
  },
  newlayer:{
    id: 'edit.newlayer',
    description: 'Button text to create a new layer',
    defaultMessage: 'New'
  },
  newlayertitle:{
    id: 'edit.newlayertitle',
    description: 'Button tooltip to create a new layer',
    defaultMessage: 'Create new layer'
  },
  disable: {
    id: 'edit.disable',
    description: 'Button text to disable edit mode',
    defaultMessage: 'Disable'
  },
  disabletitle: {
    id: 'edit.disabletitle',
    description: 'Button tooltip to disable edit mode',
    defaultMessage: 'Disable edit mode'
  },
  layerlabel: {
    id: 'edit.layerlabel',
    description: 'Label to show in front of layer combo box',
    defaultMessage: 'Layer'
  },
  newfeaturemodaltitle: {
    id: 'edit.newfeaturemodaltitle',
    description: 'Title for the modal dialog to specify attributes for a new feature',
    defaultMessage: 'New feature attributes'
  },
  okbuttontitle: {
    id: 'edit.okbuttontitle',
    description: 'Title text for Ok button in attributes modal',
    defaultMessage: 'Set feature attributes'
  },
  okbuttontext: {
    id: 'edit.okbuttontext',
    description: 'Text for Ok button in attributes modal',
    defaultMessage: 'Ok'
  },
  createlayermodaltitle: {
    id: 'edit.createlayermodaltitle',
    description: 'Title for the modal dialog to create a new layer',
    defaultMessage: 'Create new layer'
  },
  layernamelabel: {
    id: 'edit.layernamelabel',
    description: 'Label for the layer name input field in the create layer modal',
    defaultMessage: 'Layer title'
  },
  geometrytypelabel: {
    id: 'edit.geometrytypelabel',
    description: 'Label for the geometry type combo in the create layer modal',
    defaultMessage: 'Geometry type'
  },
  pointgeomtype: {
    id: 'edit.pointgeomtype',
    description: 'Title for point geometry option in combo box',
    defaultMessage: 'Point'
  },
  linegeomtype: {
    id: 'edit.linegeomtype',
    description: 'Title for line geometry option in combo box',
    defaultMessage: 'LineString'
  },
  polygeomtype: {
    id: 'edit.polygeomtype',
    description: 'Title for polygon geometry option in combo box',
    defaultMessage: 'Polygon'
  },
  attributeslabel: {
    id: 'edit.attributeslabel',
    description: 'Label for attributes input field in new layer dialog',
    defaultMessage: 'Attributes (comma-separated names)'
  },
  strokecolorlabel: {
    id: 'edit.strokecolorlabel',
    description: 'Label for stroke color field in new layer dialog',
    defaultMessage: 'Stroke color'
  },
  fillcolorlabel: {
    id: 'edit.fillcolorlabel',
    description: 'Label for fill color field in new layer dialog',
    defaultMessage: 'Fill color'
  },
  createbuttontitle: {
    id: 'edit.createbuttontitle',
    description: 'Title for create button in new layer dialog',
    defaultMessage: 'Create empty layer'
  },
  createbuttontext: {
    id: 'edit.createbuttontext',
    description: 'Text for create button in new layer dialog',
    defaultMessage: 'Create'
  },
  closebuttontext: {
    id: 'edit.closebuttontext',
    description: 'Text for close button',
    defaultMessage: 'Close'
  },
  closebuttontitle: {
    id: 'edit.closebuttontitle',
    description: 'Tooltip for close button',
    defaultMessage: 'Close dialog'
  }
});

/**
 * A component that allows creating new features, so drawing their geometries and setting feature attributes through a form.
 *
 * ```xml
 * <Edit toggleGroup='navigation' map={map} />
 * ```
 */
class Edit extends React.PureComponent {
  static propTypes = {
    /**
     * The map onto which to activate and deactivate the interactions.
     */
    map: React.PropTypes.instanceOf(ol.Map).isRequired,
    /**
     * The toggleGroup to use. When this tool is activated, all other tools in the same toggleGroup will be deactivated.
     */
    toggleGroup: React.PropTypes.string,
    /**
     * Identifier to use for this tool. Can be used to group tools together.
     */
    toolId: React.PropTypes.string,
    /**
     * The stroke width in pixels used in the style for the created features.
     */
    strokeWidth: React.PropTypes.number,
    /**
     * The point radius used for the circle style.
     */
    pointRadius: React.PropTypes.number,
    /**
     * Style config for root div.
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

  static defaultProps = {
    style: {
      padding: 10
    },
    strokeWidth: 2,
    pointRadius: 7
  };

  constructor(props, context) {
    super(props);
    this._dispatchToken = ToolUtil.register(this);
    this._interactions = {};
    this.state = {
      layers: [],
      muiTheme: context.muiTheme || getMuiTheme(),
      enable: true,
      attributes: null,
      attributeOpen: false,
      open: false
    };
    this._strokeColor = '#452135';
    this._fillColor = '#452135';
    var me = this;
    this._dispatchToken = AppDispatcher.register((payload) => {
      let action = payload.action;
      switch (action.type) {
        case LayerConstants.REMOVE_LAYER:
          me.removeLayer(action.layer);
          break;
        default:
          break;
      }
    });
  }
  componentWillUnmount() {
    AppDispatcher.unregister(this._dispatchToken);
  }
  removeLayer(layer) {
    var idx = -1;
    for (var i = 0, ii = this.state.layers.length; i < ii; ++i) {
      if (this.state.layers[i] === layer) {
        idx = i;
        break;
      }
    }
    if (idx !== -1) {
      var layers = this.state.layers.slice();
      layers.splice(idx, 1);
      this.setState({layers: layers});
    }
  }
  _onChangeStroke(color) {
    this._strokeColor = util.transformColor(color);
  }
  _onChangeFill(color) {
    this._fillColor = util.transformColor(color);
  }
  _generateId() {
    return ID_PREFIX + this.state.layers.length;
  }
  _createLayer() {
    var layerName = this.refs.layerName.getValue();
    var geometryType = this.state.geometryType;
    var attributes = this.refs.attributes.getValue();
    if (layerName !== '') {
      var fill = this._fillColor ? new ol.style.Fill({color: this._fillColor}) : undefined;
      var stroke = this._strokeColor ? new ol.style.Stroke({color: this._strokeColor, width: this.props.strokeWidth}) : undefined;
      var style = new ol.style.Style({
        fill: fill,
        stroke: stroke,
        image: (fill || stroke) ? new ol.style.Circle({stroke: stroke, fill: fill, radius: this.props.pointRadius}) : undefined
      });
      var layer = new ol.layer.Vector({
        title: layerName,
        id: this._generateId(),
        geomType: geometryType,
        schema: attributes,
        isSelectable: true,
        isRemovable: true,
        style: style,
        source: new ol.source.Vector({wrapX: false, useSpatialIndex: false})
      });
      this.props.map.addLayer(layer);
      var layers = this.state.layers.slice();
      layers.push(layer);
      this._layer = layer.get('id');
      this.setState({open: false, geometryType: null, layers: layers});
    }
  }
  activate(interactions) {
    ToolUtil.activate(this, interactions);
  }
  deactivate() {
    ToolUtil.deactivate(this);
  }
  disableEditMode() {
    this.setState({enable: true});
    this.deactivate();
  }
  _findLayerById(layerId) {
    for (var i = 0, ii = this.state.layers.length; i < ii; ++i) {
      if (this.state.layers[i].get('id') === layerId) {
        return this.state.layers[i];
      }
    }
  }
  _onLayerChange(evt, idx, value) {
    this._layer = value;
    this.setState({layer: this._layer});
  }
  _enableEditMode() {
    this._activate();
    this.setState({enable: false});
  }
  _addFeatureDialog(feature, attributes) {
    this._feature = feature;
    this.setState({
      attributes: attributes,
      attributeOpen: true
    });
  }
  _setAttributes() {
    var feature = this._feature;
    for (var i = 0, ii = this.state.attributes.length; i < ii; ++i) {
      var name = this.state.attributes[i];
      var value = ReactDOM.findDOMNode(this.refs[NEW_ATTR_PREFIX + name]).value;
      feature.set(name, value);
    }
    this.setState({
      attributeOpen: false
    });
  }
  _activate() {
    var layerId = this._layer;
    var layer = this._findLayerById(layerId);
    var featColl = layer.getSource().getFeaturesCollection();
    if (!this._interactions[layerId]) {
      this._interactions[layerId] = {
        draw: new ol.interaction.Draw({
          features: featColl,
          type: layer.get('geomType')
        }),
        modify: new ol.interaction.Modify({
          features: featColl,
          deleteCondition: function(event) {
            return ol.events.condition.shiftKeyOnly(event) &&
              ol.events.condition.singleClick(event);
          }
        })
      };
      var schema = layer.get('schema').trim();
      if (schema.length > 0) {
        this._interactions[layerId].draw.on('drawend', function(evt) {
          this._addFeatureDialog(evt.feature, schema.split(','));
        }, this);
      }
    }
    var draw = this._interactions[layerId].draw;
    var modify = this._interactions[layerId].modify;
    this.deactivate();
    this.activate([draw, modify]);
  }
  _showModal() {
    this.setState({open: true});
  }
  _changeGeometryType(evt, idx, value) {
    this.setState({
      geometryType: value
    });
  }
  close() {
    this.setState({
      open: false
    });
  }
  closeAttributes() {
    this.setState({
      attributeOpen: false
    });
  }
  render() {
    const {formatMessage} = this.props.intl;
    var options = [], i, ii;
    for (i = 0, ii = this.state.layers.length; i < ii; ++i) {
      var lyr = this.state.layers[i], title = lyr.get('title'), id = lyr.get('id');
      options.push(<MenuItem className='edit-layer-selector-option' key={id} value={id} primaryText={title} />);
    }
    var button;
    if (this.state.enable === true) {
      button = (<Button tooltip={formatMessage(messages.enabletitle)} disabled={this.state.layers.length === 0} label={formatMessage(messages.enable)} onTouchTap={this._enableEditMode.bind(this)} />);
    } else {
      button = (<Button tooltip={formatMessage(messages.disabletitle)} disabled={this.state.layers.length === 0} label={formatMessage(messages.disable)} onTouchTap={this.disableEditMode.bind(this)} />);
    }
    var attributeFormItems;
    if (this.state.attributes !== null) {
      attributeFormItems = [];
      for (i = 0, ii = this.state.attributes.length; i < ii; ++i) {
        var name = this.state.attributes[i], ref = NEW_ATTR_PREFIX + name;
        attributeFormItems.push(<TextField key={ref} floatingLabelText={name} ref={ref} />);
      }
    }
    var attributeActions = [
      <Button buttonType='Flat' tooltip={formatMessage(messages.okbuttontitle)} label={formatMessage(messages.okbuttontext)} onTouchTap={this._setAttributes.bind(this)} />,
      <Button buttonType='Flat' tooltip={formatMessage(messages.closebuttontitle)} label={formatMessage(messages.closebuttontext)} onTouchTap={this.closeAttributes.bind(this)} />
    ];
    var actions = [
      <Button buttonType='Flat' tooltip={formatMessage(messages.createbuttontitle)} label={formatMessage(messages.createbuttontext)} onTouchTap={this._createLayer.bind(this)} />,
      <Button buttonType='Flat' tooltip={formatMessage(messages.closebuttontitle)} label={formatMessage(messages.closebuttontext)} onTouchTap={this.close.bind(this)} />
    ];
    return (
      <Paper zDepth={0} className={classNames('sdk-component edit', this.props.className)}>
        <SelectField className='edit-layer-selector' disabled={this.state.layers.length === 0} onChange={this._onLayerChange.bind(this)} floatingLabelText={formatMessage(messages.layerlabel)} value={this._layer} ref='layer'>
          {options}
        </SelectField>
        <Toolbar>
          <ToolbarGroup>
            <Button tooltip={formatMessage(messages.newlayertitle)} label={formatMessage(messages.newlayer)} onTouchTap={this._showModal.bind(this)} />
          </ToolbarGroup>
          <ToolbarGroup>
            {button}
          </ToolbarGroup>
        </Toolbar>
        <Dialog open={this.state.attributeOpen} actions={attributeActions} autoScrollBodyContent={true} onRequestClose={this.closeAttributes.bind(this)} modal={true} title={formatMessage(messages.newfeaturemodaltitle)}>
          {attributeFormItems}
        </Dialog>
        <Dialog actions={actions} onRequestClose={this.close.bind(this)} modal={true} autoScrollBodyContent={true} title={formatMessage(messages.createlayermodaltitle)} open={this.state.open}>
          <TextField style={{width: 512}} floatingLabelText={formatMessage(messages.layernamelabel)} ref="layerName" /><br/>
          <SelectField style={{width: 512}} value={this.state.geometryType} onChange={this._changeGeometryType.bind(this)} floatingLabelText={formatMessage(messages.geometrytypelabel)} ref='geometryType'>
            <MenuItem key='Point' value='Point' primaryText={formatMessage(messages.pointgeomtype)} />
            <MenuItem key='LineString' value='LineString' primaryText={formatMessage(messages.linegeomtype)} />
            <MenuItem key='Polygon' value='Polygon' primaryText={formatMessage(messages.polygeomtype)} />
          </SelectField><br/>
          <TextField style={{width: 512}} floatingLabelText={formatMessage(messages.attributeslabel)} ref="attributes" /><br/>
          <label>{formatMessage(messages.strokecolorlabel)}</label>
          <ColorPicker type='compact' onChangeComplete={this._onChangeStroke.bind(this)} ref='strokeColor' color={this._strokeColor} />
          <label>{formatMessage(messages.fillcolorlabel)}</label>
          <ColorPicker type='compact' onChangeComplete={this._onChangeFill.bind(this)} ref='fillColor' color={this._fillColor} />
       </Dialog>
      </Paper>
    );
  }
}

export default injectIntl(Edit, {withRef: true});
