/* Copyright 2015-present Boundless Spatial Inc., http://boundlessgeo.com
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
import {DragSource, DropTarget} from 'react-dnd';
import ol from 'openlayers';
import Dialog from './Dialog';
import Button from './Button';
import FeatureTable from './FeatureTable';
import FilterModal from './FilterModal';
import classNames from 'classnames';
import LabelModal from './LabelModal';
import StyleModal from './StyleModal';
import LayerActions from '../actions/LayerActions';
import SLDService from '../services/SLDService';
import WMSService from '../services/WMSService';
import Slider from 'material-ui/Slider';
import {ListItem} from 'material-ui/List';
import WMSLegend from './WMSLegend';
import ArcGISRestLegend from './ArcGISRestLegend';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import FileSaver from 'file-saver';
import {createDragPreview} from 'react-dnd-text-dragpreview';

const layerListItemSource = {

  canDrag(props, monitor) {
    return (props.layer.get('canDrag') !== false && props.allowReordering && props.layer.get('type') !== 'base' && props.layer.get('type') !== 'base-group');
  },
  beginDrag(props) {
    return {
      index: props.index,
      layer: props.layer,
      group: props.group
    };
  }
};

const layerListItemTarget = {
  hover(props, monitor, component) {
    if (props.layer.get('type') === 'base' || props.layer.get('type') === 'base-group') {
      return;
    }
    var sourceItem = monitor.getItem();
    const dragIndex = sourceItem.index;
    const hoverIndex = props.index;
    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    var comp = ReactDOM.findDOMNode(component);
    if (!comp) {
      return;
    }
    const hoverBoundingRect = comp.getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.moveLayer(dragIndex, hoverIndex, sourceItem.layer, sourceItem.group);
  }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview()
  };
}

function collectDrop(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget()
  };
}

const dragPreviewStyleDefault = {
  backgroundColor: 'rgb(68, 67, 67)',
  color: 'white',
  fontSize: 14,
  paddingTop: 4,
  paddingRight: 7,
  paddingBottom: 6,
  paddingLeft: 7,
  fontFamily: 'Roboto'
}

const messages = defineMessages({
  closebutton: {
    id: 'layerlist.closebutton',
    description: 'Text for close button',
    defaultMessage: 'Close'
  },
  tablemodaltitle: {
    id: 'layerlist.tablemodaltitle',
    description: 'Title for the table modal',
    defaultMessage: 'Table'
  },
  zoombuttonlabel: {
    id: 'layerlist.zoombuttonlabel',
    description: 'Tooltip for the zoom to layer button',
    defaultMessage: 'Zoom to layer'
  },
  downloadbuttonlabel: {
    id: 'layerlist.downloadbuttonlabel',
    description: 'Tooltip for the download layer button',
    defaultMessage: 'Download layer'
  },
  filterbuttonlabel: {
    id: 'layerlist.filterbuttonlabel',
    description: 'Tooltip for the zoom button',
    defaultMessage: 'Filter layer'
  },
  labelbuttonlabel: {
    id: 'layerlist.labelbuttonlabel',
    description: 'Tooltip for the label button',
    defaultMessage: 'Edit layer label'
  },
  stylingbuttonlabel: {
    id: 'layerlist.stylingbuttonlabel',
    description: 'Tooltip for the style layer button',
    defaultMessage: 'Edit layer style'
  },
  removebuttonlabel: {
    id: 'layerlist.removebuttonlabel',
    description: 'Tooltip for the remove layer button',
    defaultMessage: 'Remove layer'
  },
  editbuttonlabel: {
    id: 'layerlist.editbuttonlabel',
    description: 'Tooltip for the edit layer button',
    defaultMessage: 'Edit layer'
  },
  tablebuttonlabel: {
    id: 'layerlist.tablebuttonlabel',
    description: 'Tooltip for the table button',
    defaultMessage: 'Show table'
  },
  draglayerlabel: {
    id: 'layerlist.draglayerlabel',
    description: 'Text on label when dragging',
    defaultMessage: 'Moving Layer'
  }
}) || /*istanbul ignore next: no testing messages */{};

/**
$$src/components/LayerListItemDetail.md$$
 */

class LayerListItem extends React.Component {
  static propTypes = {
    /**
     * @ignore
     */
    connectDragSource: React.PropTypes.func.isRequired,
    /**
     * @ignore
     */
    connectDragPreview: React.PropTypes.func.isRequired,
    /**
     * @ignore
     */
    connectDropTarget: React.PropTypes.func.isRequired,
    /**
     * @ignore
     */
    isDragging: React.PropTypes.bool,
    /**
    * @ignore
    */
    Item: React.PropTypes.object,
    /**
    * @ignore
    */
    moveLayer: React.PropTypes.func.isRequired,
    /**
     * @ignore
     */
    index: React.PropTypes.number.isRequired,
    /**
     * The map in which the layer of this item resides.
     */
    map: React.PropTypes.instanceOf(ol.Map).isRequired,
    /**
     * The layer associated with this item.
     */
    layer: React.PropTypes.instanceOf(ol.layer.Base).isRequired,
    /**
     * The group layer to which this item might belong.
     */
    group: React.PropTypes.instanceOf(ol.layer.Group),
    /**
     * The feature format to serialize in for downloads.
     */
    downloadFormat: React.PropTypes.oneOf(['GeoJSON', 'KML', 'GPX']),
    /**
     * The title to show for the layer.
     */
    title: React.PropTypes.string.isRequired,
    /**
     * Should we show a button that can open up the feature table?
     */
    showTable: React.PropTypes.bool,
    /**
     * Should we show a zoom to button for the layer?
     */
    showZoomTo: React.PropTypes.bool,
    /**
     * Should we show allow reordering?
     */
    allowReordering: React.PropTypes.bool,
    /**
     * Should we allow for filtering of features in a layer?
     */
    allowFiltering: React.PropTypes.bool,
    /**
     * Should we allow for removal of layers?
     */
    allowRemove: React.PropTypes.bool,
    /**
     * Should we allow editing of features in a vector layer?
     */
    allowEditing: React.PropTypes.bool,
    /**
     * Should we allow for labeling of features in a layer?
     */
    allowLabeling: React.PropTypes.bool,
    /**
     * Should we allow for styling of features in a vector layer?
     */
    allowStyling: React.PropTypes.bool,
    /**
     * Should we show a download button?
     */
    showDownload: React.PropTypes.bool,
    /**
     * Should we include the legend in the layer list?
     */
    includeLegend: React.PropTypes.bool,
    /**
     * Should groups be collapsible?
     */
    collapsible: React.PropTypes.bool,
    /**
     * The nested items to show for this item.
     */
    nestedItems: React.PropTypes.array,
    /**
     * Should we show an opacity slider for the layer?
     */
    showOpacity: React.PropTypes.bool,
    /**
     * Css class name to apply on the root element of this component.
     */
    className: React.PropTypes.string,
    /**
     * Style config for when label is out of scale.
     */
    labelStyleOutOfScale: React.PropTypes.object,
    /**
     * Should we handle resolution changes to show when a layer is in or out of scale?
     */
    handleResolutionChange: React.PropTypes.bool,
    /**
     * Should dialogs show inline instead of a modal?
     */
    inlineDialogs: React.PropTypes.bool,
    /**
    *  State from parent component to manage baseLayers
    */
    currentBaseLayer: React.PropTypes.string,
    /**
    *  Style for text of dragged layer
    */
    dragPreviewStyle: React.PropTypes.object,
    /**
    *  Callback from parent component to manage baseLayers
    */
    setBaseLayer: React.PropTypes.func,
    /**
     * @ignore
     */
    intl: intlShape.isRequired
  } || /*istanbul ignore next: no testing PropTypes */ {};

  static contextTypes = {
    muiTheme: React.PropTypes.object,
    proxy: React.PropTypes.string,
    requestHeaders: React.PropTypes.object
  } || /*istanbul ignore next: no testing ContextTypes */{};

  static childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired
  } || /*istanbul ignore next: no testing ContextTypes */{};

  static defaultProps = {
    connectDragSource: function(a) {
      return a;
    },
    connectDropTarget: function(a) {
      return a;
    },
    connectDragPreview: function(a) {
      return a;
    }
  };

  constructor(props, context) {
    super(props);
    this._proxy = context.proxy;
    this._requestHeaders = context.requestHeaders;
    this._muiTheme = context.muiTheme || getMuiTheme();
    this.state = {
      filterOpen: false,
      labelOpen: false,
      tableOpen: false,
      open: (props.layer.get('isGroupExpanded') === false) ? false : true,
      styleOpen: false,
      checked: props.layer.getVisible(),
      previousBase: ''
    };
  }

  getChildContext() {
    return {muiTheme: this._muiTheme};
  }
  componentDidMount() {
    var dragPreviewStyle = this.props.dragPreviewStyle  || dragPreviewStyleDefault;

    const dragPreview = createDragPreview(this.formatDragMessage(this.props), dragPreviewStyle)
    this.props.connectDragPreview(dragPreview)

    if (this.props.group) {
      if (this.props.group.get('type') !== 'base-group') {
        this.props.group.on('change:visible', this._changeGroupVisible, this);
      }
    }
    this.props.layer.on('change:visible', this._changeLayerVisible, this);
    if (this.props.handleResolutionChange) {
      this.props.map.getView().on('change:resolution', this._changeResolution, this);
    }
    if (!this.props.layer.get('wfsInfo')) {
      this.props.layer.once('change:wfsInfo', function() {
        this.forceUpdate();
      }, this);
    }
  }
  componentWillUnmount() {
    if (this.props.group) {
      if (this.props.group.get('type') !== 'base-group') {
        this.props.group.un('change:visible', this._changeGroupVisible, this);
      }
    }
    this.props.layer.un('change:visible', this._changeLayerVisible, this);
    if (this.props.handleResolutionChange) {
      this.props.map.getView().un('change:resolution', this._changeResolution, this);
    }
  }

  // provides custom message for dragPreview
  formatDragMessage(props) {
    const {formatMessage} = this.props.intl;
    const title = props.layer.get('title');
    //IE might not like es6 template strings
    return `${formatMessage(messages.draglayerlabel)} - ${title}`;
  }
static formats = {
  GeoJSON: {
    format: new ol.format.GeoJSON(),
    mimeType: 'text/json',
    extension: 'geojson'
  },
  KML: {
    format: new ol.format.KML(),
    mimeType: 'application/vnd.google-earth.kml+xml',
    extension: 'kml'
  },
  GPX: {
    format: new ol.format.GPX(),
    mimeType: 'application/gpx+xml',
    extension: 'gpx'
  }};
  _changeGroupVisible(evt) {
    this.setState({checked: evt.target.getVisible()});
  }
  _changeLayerVisible(evt) {
    this.setState({checked: evt.target.getVisible()});
    // this.forceUpdate();
  }
  _changeResolution() {
    this.setState({resolution: this.props.map.getView().getResolution()});
  }
  _getLayerGroupId(target, groups) {
    let groupId;
    let returnGroupId;
    var layers = groups.getLayers()
    layers.forEach(function(group) {
      if (group instanceof ol.layer.Group) {
        groupId = group.get('id');
        var groupLayers = group.getLayers();
        groupLayers.forEach(function(layer) {
          if (layer.get('id') === target) {
            returnGroupId = groupId;
          }
        })
      }
    })
    return returnGroupId || '';
  }
  _getParentVisibilty(target, groups) {
    let isParentVisible = true;
    let returnVal = true;
    let layers = groups.getLayers()
    layers.forEach(function(group) {
      if (group instanceof ol.layer.Group) {
        isParentVisible = group.getVisible();
        var children = group.getLayers();
        children.forEach(function(layer) {
          if (layer.get('id') === target) {
            returnVal = isParentVisible;
          }
        })
      }
    })
    return returnVal;
  }
  _handleVisibility(event) {
    var parentVisibility = this._getParentVisibilty(this.props.layer.get('id'), this.props.map.getLayerGroup());
    if (parentVisibility) {
      this.props.layer.setVisible(!this.props.layer.getVisible());
    }
  }

  _handleBaseVisibility(event) {
    var i, ii;
    var baseLayers = [];

    var layers = this.props.map.getLayers();
    this.forEachLayer(baseLayers, this.props.map.getLayerGroup());
    for (i = 0, ii = baseLayers.length; i < ii; ++i) {
      baseLayers[i].setVisible(false);
    }
    layers.forEach(function(l) {
      if (l instanceof ol.layer.Group) {
        l.setVisible(true);
      }
    })
    this.props.layer.setVisible(true);
    this.props.setBaseLayer(this.props.layer.get('id'))
  }
  forEachLayer(layers, layer) {
    var self = this;
    if (layer instanceof ol.layer.Group) {
      layer.getLayers().forEach(function(groupLayer) {
        self.forEachLayer(layers, groupLayer);
      });
    } else if (layer.get('type') === 'base') {
      layers.push(layer);
    }
  }

  _handleBaseParentVisibility(event) {
    var i, ii;
    var baseLayers = [];

    if (event.target.className.indexOf('fa-eye-slash') > 0) {
      this.props.setBaseLayer(this.state.previousBase);
      this.forEachLayer(baseLayers, this.props.map.getLayerGroup());
      for (i = 0, ii = baseLayers.length; i < ii; ++i) {
        if (baseLayers[i].get('id') === this.state.previousBase) {
          baseLayers[i].setVisible(true);
        }
      }
    } else {
      this.setState({previousBase: this.props.currentBaseLayer});
      this.props.setBaseLayer('baseParent')
      this.forEachLayer(baseLayers, this.props.map.getLayerGroup());
      for (i = 0, ii = baseLayers.length; i < ii; ++i) {
        baseLayers[i].setVisible(false);
      }
    }
  }
  _toggleNested(event) {
    this.setState({open:!this.state.open})
  }
  _download() {
    var formatInfo = this.constructor.formats[this.props.downloadFormat];
    var format = formatInfo.format;
    var layer = this.props.layer;
    var source = layer.getSource();
    if (source instanceof ol.source.Cluster) {
      source = source.getSource();
    }
    var features = source.getFeatures();
    var output = format.writeFeatures(features, {featureProjection: this.props.map.getView().getProjection()});
    var blob = new Blob([output], {type: formatInfo.mimeType + ';charset=utf-8'});
    FileSaver.saveAs(blob, layer.get('title') + '.' + formatInfo.extension);
  }
  _filter() {
    this.setState({
      filterOpen: true
    });
  }
  _closeFilter() {
    this.setState({
      filterOpen: false
    });
  }
  _label() {
    this.setState({
      labelOpen: true
    });
  }
  _closeLabel() {
    this.setState({
      labelOpen: false
    });
  }
  _style() {
    if (!this.props.layer.get('styleInfo')) {
      var sld_body;
      if (!(this.props.layer instanceof ol.layer.Vector)) {
        sld_body = this.props.layer.getSource().getParams().SLD_BODY;
      }
      if (sld_body) {
        this.props.layer.set('styleInfo', SLDService.parse(sld_body));
        this._showStyling();
      } else {
        var me = this;
        WMSService.getStyles(this.props.layer.get('wfsInfo').url, this.props.layer, function(info) {
          me.props.layer.set('styleInfo', info);
          me._showStyling();
        }, undefined, this._proxy, this._requestHeaders);
      }
    } else {
      this._showStyling();
    }
  }
  _modifyLatLonBBOX(bbox) {
    bbox[0] = Math.max(-180, bbox[0]);
    bbox[1] = Math.max(-85, bbox[1]);
    bbox[2] = Math.min(180, bbox[2]);
    bbox[3] = Math.min(85, bbox[3]);
    return bbox;
  }
  _showTable() {
    this.setState({
      tableOpen: true
    });
  }
  _closeTable() {
    this.setState({
      tableOpen: false
    });
  }
  _showStyling() {
    this.props.layer.set('canDrag', false);
    this.setState({
      styleOpen: true
    });
  }
  _closeStyling() {
    this.setState({
      styleOpen: false
    });
    this.props.layer.set('canDrag', true);
  }
  _zoomTo() {
    var map = this.props.map;
    var view = map.getView();
    var extent = this.props.layer.get('EX_GeographicBoundingBox');
    if (extent) {
      if (view.getProjection().getCode() === 'EPSG:3857') {
        this._modifyLatLonBBOX(extent);
      }
      extent = ol.proj.transformExtent(extent, 'EPSG:4326', view.getProjection());
    }
    if (!extent) {
      extent = this.props.layer.getSource().getExtent();
    }
    map.getView().fit(
      extent,
      map.getSize()
    );
  }
  _remove() {
    LayerActions.removeLayer(this.props.layer, this.props.group);
  }
  _edit() {
    LayerActions.editLayer(this.props.layer);
  }
  _changeOpacity(evt, value) {
    this.props.layer.setOpacity(value);
  }
  _onTableUpdate() {
    if (this.refs.tableModal) {
      this.refs.tableModal.forceUpdate();
    }
  }
  calculateInRange() {
    if (!this.props.handleResolutionChange) {
      return true;
    }
    var layer = this.props.layer;
    var map = this.props.map;
    var resolution = map.getView().getResolution();
    return (resolution >= layer.getMinResolution() && resolution < layer.getMaxResolution());
  }

  _handleMenuOpen = (event) => {
    // This prevents ghost click.
    event.preventDefault();

    this.setState({
      popover: true,
      anchorEl: event.currentTarget
    });
  };
  _handleRequestClose = () => {
    this.setState({
      popover: false
    });
  };

  renderItem(item, isDragging) {
    if (isDragging) {
      return (<div>{item}</div>);
    }
  }
  render() {
    const {connectDragSource, connectDropTarget, isDragging, Item} = this.props;
    const layer = this.props.layer;
    const source = layer.getSource ? layer.getSource() : undefined;
    const {formatMessage} = this.props.intl;
    var opacity;
    if (this.props.showOpacity && source && layer.get('type') !== 'base') {
      var val = layer.getOpacity();
      var slider = (<Slider sliderStyle={{marginTop: '0px', top: '14px', marginBottom: '0'}} defaultValue={val} onChange={this._changeOpacity.bind(this)} />);
      opacity = <MenuItem leftIcon={<i className='menuIcon ms ms-opacity'></i>}>{slider}</MenuItem>
    }
    var table;
    if (this.props.showTable && (this.props.layer instanceof ol.layer.Vector || this.props.layer.get('wfsInfo') !== undefined)) {
      table = (<MenuItem onTouchTap={this._showTable.bind(this)} primaryText={formatMessage(messages.tablebuttonlabel)} leftIcon={<i className='fa fa-table'></i>} />);
    }

    var downArrow = <i className="fa fa-angle-down" onTouchTap={this._toggleNested.bind(this)}></i>;
    var sideArrow = <i className="fa fa-angle-right" onTouchTap={this._toggleNested.bind(this)}></i>;
    var arrowIcon = this.state.open ? downArrow : sideArrow;

    var layersIcon = <i className="ms ms-layers"></i>;
    if (layer.get('type') !== 'base-group' &&  !(layer instanceof ol.layer.Group)) {
      arrowIcon = <i className="fa fa-fw" ></i>;
    }
    var zoomTo;
    if (layer.get('type') !== 'base' && layer.get('type') !== 'base-group' && ((source && source.getExtent) || layer.get('EX_GeographicBoundingBox')) && this.props.showZoomTo) {
      zoomTo = <i className="fa fa-crosshairs" onTouchTap={this._zoomTo.bind(this)}></i>;
    }
    var download;
    if (layer instanceof ol.layer.Vector && this.props.showDownload) {
      var disabled = false;
      if (this.props.downloadFormat === 'GPX') {
        var features = layer.getSource().getFeatures();
        if (features.length > 0) {
          var geom = features[0].getGeometry();
          disabled = (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon);
        }
      }
      download = <MenuItem disabled={disabled} primaryText={formatMessage(messages.downloadbuttonlabel)} leftIcon={<i className='fa fa-download'></i>}onTouchTap={this._download.bind(this)}/>
    }
    var filter;
    if (layer instanceof ol.layer.Vector && this.props.allowFiltering) {
      filter = <MenuItem primaryText={formatMessage(messages.filterbuttonlabel)} leftIcon={<i className='fa fa-filter'></i>} onTouchTap={this._filter.bind(this)} />
    }
    var label;
    if (layer instanceof ol.layer.Vector && this.props.allowLabeling) {
      label = (<MenuItem primaryText={formatMessage(messages.labelbuttonlabel)} leftIcon={<i className='fa fa-tag'></i>} onTouchTap={this._label.bind(this)} />);
    }
    var remove;
    if (this.props.allowRemove && layer.get('type') !== 'base' && layer.get('isRemovable') === true) {
      remove = <MenuItem primaryText={formatMessage(messages.removebuttonlabel)} leftIcon={<i className='menuIcon fa fa-trash'></i>}onTouchTap={this._remove.bind(this)} />
    }
    var edit;
    if (this.props.allowEditing && layer.get('isWFST') === true) {
      edit = (<MenuItem onTouchTap={this._edit.bind(this)} primaryText={formatMessage(messages.editbuttonlabel)} leftIcon={<i className='fa fa-pencil'></i>} />);
    }
    var tableModal, labelModal, filterModal, styleModal;
    if (this.props.layer instanceof ol.layer.Vector) {
      labelModal = (<LabelModal {...this.props} ref='labelModal' open={this.state.labelOpen} onRequestClose={this._closeLabel.bind(this)} inline={this.props.inlineDialogs} layer={this.props.layer} />);
      filterModal = (<FilterModal {...this.props} ref='filterModal' open={this.state.filterOpen} onRequestClose={this._closeFilter.bind(this)} inline={this.props.inlineDialogs} layer={this.props.layer} />);
    }
    var styling = <i className="fa fa-fw" ></i>;
    var canStyle = layer.get('wfsInfo') && this.props.allowStyling;
    if (canStyle) {
      styling = (<i className='ms ms-style' onTouchTap={this._style.bind(this)}> </i>);
      styleModal = (<StyleModal {...this.props} ref='styleModal' open={this.state.styleOpen} inline={this.props.inlineDialogs} onRequestClose={this._closeStyling.bind(this)} layer={this.props.layer} />);
    }
    if (this.props.showTable && (this.props.layer instanceof ol.layer.Vector || this.props.layer.get('wfsInfo') !== undefined)) {
      var actions = [
        <Button buttonType='Flat' label={formatMessage(messages.closebutton)} onTouchTap={this._closeTable.bind(this)} />
      ];
      tableModal = (
        <Dialog ref='tableModal' inline={this.props.inlineDialogs} actions={actions} title={formatMessage(messages.tablemodaltitle)} open={this.state.tableOpen} onRequestClose={this._closeTable.bind(this)}>
          <div style={{height: 400}}>
            <FeatureTable allowEdit={this.props.inlineDialogs} onUpdate={this._onTableUpdate.bind(this)} map={this.props.map} layer={this.props.layer} intl={this.props.intl}/>
          </div>
        </Dialog>
      );
    }
    var legend;
    if (this.props.includeLegend && this.props.layer.getVisible() && this.calculateInRange()) {
      if ((this.props.layer instanceof ol.layer.Tile && this.props.layer.getSource() instanceof ol.source.TileWMS) ||
      (this.props.layer instanceof ol.layer.Image && this.props.layer.getSource() instanceof ol.source.ImageWMS)) {
        legend = <WMSLegend layer={this.props.layer} />;
      }
      if (this.props.layer instanceof ol.layer.Tile && this.props.layer.getSource() instanceof ol.source.TileArcGISRest) {
        legend = <ArcGISRestLegend layer={this.props.layer} />;
      }
    }

    var showBasemapEye = this.props.layer.get('visible') || this.props.currentBaseLayer === this.props.layer.get('id');
    var checked = <i className='fa fa-eye' onTouchTap={this._handleVisibility.bind(this)}></i>;
    var unchecked = <i className='fa fa-eye-slash' onTouchTap={this._handleVisibility.bind(this)}></i>;
    var baseVisibility = <i onTouchTap={this._handleBaseVisibility.bind(this)} className={classNames({'fa':true, 'fa-eye':showBasemapEye, 'fa-eye-slash':!showBasemapEye})}></i>;
    var baseParentVisibility = <i id='baseParentVisibility' onTouchTap={this._handleBaseParentVisibility.bind(this)} className={classNames({'fa':true, 'fa-eye-slash':this.props.currentBaseLayer === 'baseParent', 'fa-eye':this.props.currentBaseLayer !== 'baseParent'})}></i>;
    var fixedWidth =  <i className='fa fa-fw'></i>;

    var isVisible = this.state.checked;
    if (!this.props.layer.getVisible() && this.state.checked) {
      isVisible = false;
    }
    var visibility = isVisible ? checked : unchecked;
    var popoverEllipsis = (!(this.props.layer instanceof ol.layer.Group) && (opacity || download || filter || remove || table || label || edit)) ? (
      <div>
        <i className="fa fa-ellipsis-v" onTouchTap={this._handleMenuOpen.bind(this)}></i>
        <Popover
            open={this.state.popover}
            anchorEl={this.state.anchorEl}
            anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
            targetOrigin={{horizontal: 'right', vertical: 'top'}}
            onRequestClose={this._handleRequestClose.bind(this)}
          >
            <Menu>
              {opacity}
              <Divider/>
              {download}
              {filter}
              {remove}
              {table}
              {label}
              {edit}
            </Menu>
          </Popover>
      </div>
      ) : undefined;
    var flexContainer = {
      display: 'flex',
      padding: '16px'
    };
    var muted;
    var isNested = false;
    var rightIconButtons = <span className="fixedContainer">{styling}{zoomTo}{visibility}{popoverEllipsis}</span>;
    if (layer.get('type') === 'base-group') {
      rightIconButtons = <span className="fixedContainer">{baseParentVisibility}{fixedWidth}</span>;
      muted = this.props.currentBaseLayer === 'baseParent';
    }else if (layer.get('type') === 'base') {
      rightIconButtons = <span className="fixedContainer">{baseVisibility}{fixedWidth}</span>;
      muted = !showBasemapEye;
      isNested = true;
    }else if (layer instanceof ol.layer.Group) {
      rightIconButtons = <span className="fixedContainer">{visibility}{fixedWidth}</span>;
      muted = !isVisible;
    } else {
      isNested = !!this._getLayerGroupId(layer.get('id'), this.props.map.getLayerGroup());
      muted = !isVisible;
    }
    return connectDragSource(connectDropTarget(
      <div>
        <ListItem
          className={classNames({'sdk-component': true, 'menuItemContainer': true, 'layer-list-item': true}, this.props.className)}
          insetChildren={true}
          innerDivStyle={flexContainer}
          autoGenerateNestedIndicator={false}
          primaryText={<span className={classNames({'menuItem':true, muted, 'n1':isNested})}><span className="statusIcons">{arrowIcon}{layersIcon} <span className={'layer-list-name'}>{this.props.title}</span></span>{rightIconButtons}</span>}
          nestedItems={this.props.nestedItems}
          open={this.state.open} />
        <div style={{paddingLeft: 72}}>
          {legend}
          <span>
            {filterModal}
            {labelModal}
            {styleModal}
            {tableModal}
          </span>
        </div>
        {this.renderItem(Item, isDragging)}
    </div>
));

  }
}

export default injectIntl(DropTarget('layerlistitem', layerListItemTarget, collectDrop)(DragSource('layerlistitem', layerListItemSource, collect)(LayerListItem)));
