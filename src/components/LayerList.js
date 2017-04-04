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
import debounce from  'debounce';
import HTML5Backend from 'react-dnd-html5-backend';
import {DragDropContext} from 'react-dnd';
import LayerActions from '../actions/LayerActions';
import ol from 'openlayers';
import classNames from 'classnames';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import LayerIdService from '../services/LayerIdService';
import LayerStore from '../stores/LayerStore';
import LayerListItem from './LayerListItem';
import Label from './Label';
import AddLayerModal from './AddLayerModal';
import BaseMapModal from './BaseMapModal';
import RaisedButton from 'material-ui/RaisedButton';
import Button from './Button';
import {List} from 'material-ui/List';
import LayersIcon from 'material-ui/svg-icons/maps/layers';
import BaseMapIcon from 'material-ui/svg-icons/maps/satellite';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import Paper from 'material-ui/Paper';
import './LayerList.css';

const messages = defineMessages({
  layertitle: {
    id: 'layerlist.layertitle',
    description: 'List of layers',
    defaultMessage: 'Layers'
  },
  addlayertitle: {
    id: 'layerlist.addlayertitle',
    description: 'Title for Add layers button',
    defaultMessage: 'Add layers'
  },
  addlayertext: {
    id: 'layerlist.addlayertext',
    description: 'Text for Add layers button',
    defaultMessage: ' Add Layer'
  },
  addbasemaptext: {
    id: 'layerlist.addbasemaptext',
    description: 'Text for Add BaseMap button',
    defaultMessage: ' BaseMap'
  }
});

/**
 * $$src/components/LayerListDetail.md$$
 *
 */
class LayerList extends React.PureComponent {
  static propTypes = {
    /**
     * The map whose layers should show up in this layer list.
     */
    map: React.PropTypes.instanceOf(ol.Map).isRequired,
    /**
     * Style for the button.
     */
    style: React.PropTypes.object,
    /**
     * Should we show a button that allows the user to zoom to the layer's extent?
     */
    showZoomTo: React.PropTypes.bool,
    /**
     * Should we show a button that can open up the feature table?
     */
    showTable: React.PropTypes.bool,
    /**
     * Should we allow for reordering of layers?
     */
    allowReordering: React.PropTypes.bool,
    /**
     * Should we allow for filtering of features in a layer?
     */
    allowFiltering: React.PropTypes.bool,
    /**
     * Should we allow for labeling of features in a layer?
     */
    allowLabeling: React.PropTypes.bool,
    /**
     * Should we allow for styling of features in a vector layer?
     */
    allowStyling: React.PropTypes.bool,
    /**
     * Should we allow for editing of features in a vector layer?
     * This does require having a WFST component in your application.
     */
    allowEditing: React.PropTypes.bool,
    /**
     * Should we allow for removal of layers?
     */
    allowRemove: React.PropTypes.bool,
    /**
     * Should we show the contents of layer groups?
     */
    showGroupContent: React.PropTypes.bool,
    /**
     * Should we show a download button for layers?
     */
    showDownload: React.PropTypes.bool,
    /**
     * Should we include the legend in the layer list?
     */
    includeLegend: React.PropTypes.bool,
    /**
     * The feature format to serialize in for downloads.
     */
    downloadFormat: React.PropTypes.oneOf(['GeoJSON', 'KML', 'GPX']),
    /**
     * Should we show an opacity slider for layers?
     */
    showOpacity: React.PropTypes.bool,
    /**
     * Text to show on top of layers.
     */
    tipLabel: React.PropTypes.string,
    /**
     * Should we show this component on start of the application?
     */
    showOnStart: React.PropTypes.bool,
    /**
     * Should groups be collapsible?
     */
    collapsible: React.PropTypes.bool,
    /**
     * Should we allow adding base maps from a selector modal?
     */
    addBaseMap: React.PropTypes.shape({
      tileServices: React.PropTypes.arrayOf(React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
        description: React.PropTypes.string.isRequired,
        endpoint: React.PropTypes.string,
        standard: React.PropTypes.string.isRequired,
        attribution: React.PropTypes.string,
        thumbnail: React.PropTypes.string.isRequired
      }))
    }),
    /**
     * Should we allow adding layers?
     */
    addLayer: React.PropTypes.shape({
      sources: React.PropTypes.arrayOf(React.PropTypes.shape({
        title: React.PropTypes.string.isRequired,
        type: React.PropTypes.string.isRequired,
        url: React.PropTypes.string.isRequired,
        properties: React.PropTypes.object
      })),
      allowUserInput: React.PropTypes.bool
    }),
    /**
     * Css class name to apply on the root element of this component.
     */
    className: React.PropTypes.string,
    /**
     * Position of the tooltip.
     */
    tooltipPosition: React.PropTypes.oneOf(['bottom', 'bottom-right', 'bottom-left', 'right', 'left', 'top-right', 'top', 'top-left']),
    /**
     * A filter function to filter out some of the layers by returning false.
     */
    filter: React.PropTypes.func,
    /**
     * Style config for when label is out of scale.
     */
    labelStyleOutOfScale: React.PropTypes.object,
    /**
     * Should we handle resolution changes to show when a layer is in or out of scale?
     */
    handleResolutionChange: React.PropTypes.bool,
    /**
     * @ignore
     */
    children: React.PropTypes.node,
    /**
     * Should dialogs show inline instead of a modal?
     */
    inlineDialogs: React.PropTypes.bool,
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
    inlineDialogs: false,
    handleResolutionChange: true,
    labelStyleOutOfScale: {
      color: '#BBBBBB'
    },
    showZoomTo: false,
    showTable: false,
    allowReordering: false,
    allowEditing: false,
    allowFiltering: false,
    allowLabeling: false,
    allowRemove: true,
    allowStyling: false,
    showGroupContent: true,
    showDownload: false,
    downloadFormat: 'GeoJSON',
    includeLegend: false,
    showOpacity: false,
    showOnStart: false,
    collapsible: true
  };

  constructor(props, context) {
    super(props);
    LayerStore.bindMap(this.props.map);
    this.state = {
      addLayerOpen: false,
      muiTheme: context.muiTheme || getMuiTheme()
    };
    this.moveLayer = debounce(this.moveLayer, 100);
  }
  componentWillMount() {
    this._onChangeCb = this._onChange.bind(this);
    LayerStore.addChangeListener(this._onChangeCb);
    this._onChange();
    if (this.props.showOnStart) {
      this._showPanel();
    }
  }
  componentWillUnmount() {
    LayerStore.removeChangeListener(this._onChangeCb);
  }
  _onChange() {
    this.setState(LayerStore.getState());
  }
  renderLayerGroup(group) {
    return this.renderLayers(group.getLayers().getArray().slice(0).reverse(), group);
  }
  renderLayers(layers, group) {
    var me = this;
    var layerNodes = [];
    for (var i = 0, ii = layers.length; i < ii; ++i) {
      var lyr = layers[i];
      if (!this.props.filter || this.props.filter(lyr) === true) {
        layerNodes.push(me.getLayerNode(lyr, group, (ii - i) - 1));
      }
    }
    return layerNodes;
  }
  _showAddLayer() {
    this.setState({
      addLayerOpen: true
    });
  }
  _closeAddLayer() {
    this.setState({
      addLayerOpen: false
    });
  }
  _showPanel(evt) {
    if (!this.state.visible) {
      this.setState({visible: true});
    }
  }
  _togglePanel() {
    var newVisible = !this.state.visible;
    if (newVisible || this._modalOpen !== true) {
      this.setState({visible: newVisible});
    }
  }
  getLayerNode(lyr, group, idx) {
    if (this.props.addBaseMap && lyr.get('type') === 'base' && !lyr.getVisible()) {
      return undefined;
    }
    if (lyr.get('id') === undefined) {
      lyr.set('id', LayerIdService.generateId());
    }
    if (lyr.get('title') !== null) {
      if (lyr instanceof ol.layer.Group) {
        var children = this.props.showGroupContent ? this.renderLayerGroup(lyr) : [];
        return (
          <LayerListItem index={idx} moveLayer={this.moveLayer} {...this.props} key={lyr.get('id')} layer={lyr} group={group} nestedItems={children} title={lyr.get('title')} disableTouchRipple={true}/>
        );
      } else {
        return (
          <LayerListItem index={idx} moveLayer={this.moveLayer} {...this.props} key={lyr.get('id')} layer={lyr} group={group} title={lyr.get('title')} disableTouchRipple={true}/>
        );
      }
    }
  }
  _showAddBaseMap() {
    this.refs.addbasemapmodal.getWrappedInstance().open();
  }
  moveLayer(dragIndex, hoverIndex, layer, group) {
    LayerActions.moveLayer(dragIndex, hoverIndex, layer, group);
  }
  render() {
    const {formatMessage} = this.props.intl;
    var layers = this.state.layers.slice(0).reverse();
    var divClass = {
      'layer-switcher': true,
      'shown': this.state.visible,
      'sdk-component': true,
      'layer-list': true
    };
    var tipLabel = this.props.tipLabel ? (<div className='layer-list-header'><Label>{this.props.tipLabel}</Label></div>) : undefined;
    var addLayer, layerModal, baseModal;

    if (this.props.addLayer || this.props.addBaseMap) {
      var layerAdd, baseAdd;
      if (this.props.addLayer) {
        layerModal = <AddLayerModal open={this.props.addLayer.open} inline={this.props.inlineDialogs} srsName={this.props.map.getView().getProjection().getCode()} allowUserInput={this.props.addLayer.allowUserInput} onRequestClose={this.props.addLayer.onRequestClose.bind(this)} sources={this.props.addLayer.sources} map={this.props.map} />;
      }
      if (this.props.addBaseMap) {
        baseAdd = <RaisedButton icon={<BaseMapIcon />} label={formatMessage(messages.addbasemaptext)} onTouchTap={this._showAddBaseMap.bind(this)} disableTouchRipple={true}/>;
        baseModal = <BaseMapModal tileServices={this.props.addBaseMap.tileServices} map={this.props.map} ref='addbasemapmodal' />;
      }
      addLayer = (
        <span>
          {layerAdd}
          {baseAdd}
        </span>
      );
    }
    return (
      <div ref='parent' className={classNames(divClass, this.props.className)}>
        <Button tooltipPosition={this.props.tooltipPosition} buttonType='Action' mini={true} className='layerlistbutton' tooltip={formatMessage(messages.layertitle)} onTouchTap={this._togglePanel.bind(this)}><LayersIcon /></Button>
        <Paper zDepth={0} className='layer-tree-panel'>
          {tipLabel}
          <List className='layer-list-list'>
            {this.renderLayers(layers)}
          </List>
          {addLayer}
        </Paper>
        {this.props.children}
        {layerModal}
        {baseModal}
      </div>
    );
  }
}

export default injectIntl(DragDropContext(HTML5Backend)(LayerList));
