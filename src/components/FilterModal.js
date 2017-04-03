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
import classNames from 'classnames';
import FilterService from '../services/FilterService';
import Dialog from './Dialog';
import Button from './Button';
import {List, ListItem} from 'material-ui/List';
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import TextField from 'material-ui/TextField';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import FilterHelp from './FilterHelp';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

const messages = defineMessages({
  inputlabel: {
    id: 'filtermodal.inputlabel',
    description: 'Label for filter input in modal dialog, only used for screen readers',
    defaultMessage: 'Text to filter features in layer by'
  },
  addfiltertext: {
    id: 'filtermodal.addfiltertext',
    description: 'Title for the add filter button',
    defaultMessage: 'Add'
  },
  removefiltertext: {
    id: 'filtermodal.removefiltertext',
    description: 'Title for the remove filter button',
    defaultMessage: 'Remove'
  },
  title: {
    id: 'filtermodal.title',
    description: 'Title for the filter button',
    defaultMessage: 'Filters for layer {layer}'
  },
  errortext: {
    id: 'filtermodal.errortext',
    description: 'Error text',
    defaultMessage: 'Invalid filter, should be for instance foo == "Bar"'
  },
  closebutton: {
    id: 'filtermodal.closebutton',
    description: 'Text for close button',
    defaultMessage: 'Close'
  }
});

/**
 * Modal for building filters to filter the features of a local vector layer.
 *
 * ```xml
 * <FilterModal layer={myLayer} />
 * ```
 */
class FilterModal extends React.PureComponent {
  static propTypes = {
    /**
     * vector layer to filter features on.
     */
    layer: React.PropTypes.instanceOf(ol.layer.Vector).isRequired,
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
    this._muiTheme = context.muiTheme || getMuiTheme();
    this.state = {
      open: false,
      filters: [],
      hasError: false
    };
  }
  getChildContext() {
    return {muiTheme: this._muiTheme};
  }
  close() {
    this.props.onRequestClose();
  }
  _setStyleFunction() {
    var layer = this.props.layer;
    if (layer instanceof ol.layer.Vector) {
      this._styleSet = true;
      var cluster = layer.getSource() instanceof ol.source.Cluster;
      var style = layer.getStyle();
      var me = this;
      layer.setStyle(function(feature, resolution) {
        var hide = false;
        if (!cluster) {
          for (var i = 0, ii = me.state.filters.length; i < ii; i++) {
            if (!me.state.filters[i].filter(feature.getProperties())) {
              hide = true;
              continue;
            }
          }
        }
        if (hide) {
          return null;
        } else {
          if (style instanceof ol.style.Style || Array.isArray(style)) {
            return style;
          } else {
            return style.call(this, feature, resolution);
          }
        }
      });
    }
  }
  _addFilter() {
    var layer = this.props.layer;
    if (!this._styleSet) {
      this._setStyleFunction();
    }
    var filters = this.state.filters.slice();
    var filter;
    var expression = this.refs.filterTextBox.getValue();
    try {
      filter = FilterService.filter(expression);
    } catch (e) {
      this.setState({hasError: true});
      return;
    }
    var exists = false;
    for (var i = 0, ii = filters.length; i < ii; ++i) {
      if (filters[i].title === expression) {
        exists = true;
        break;
      }
    }
    if (exists === false) {
      filters.push({title: expression, filter: filter});
      this.setState({
        filters: filters,
        hasError: false
      });
      if (layer.getSource() instanceof ol.source.Cluster) {
        this._updateCluster();
      }
      layer.getSource().changed();
    }
  }
  _removeFilter(filter) {
    var layer = this.props.layer;
    var filters = this.state.filters.slice();
    for (var i = 0, ii = filters.length; i < ii; i++) {
      if (filters[i] === filter) {
        filters.splice(i, 1);
        break;
      }
    }
    this.setState({filters: filters});
    if (layer.getSource() instanceof ol.source.Cluster) {
      this._updateCluster();
    }
    layer.getSource().changed();
  }
  _updateCluster() {
    var layer = this.props.layer;
    var features = layer.getSource().getFeatures();
    for (var i = 0, ii = features.length; i < ii; ++i) {
      var subFeatures = features[i].get('features');
      for (var j = 0, jj = subFeatures.length; j < jj; ++j) {
        var hide = false;
        for (var f = 0, ff = this.state.filters.length; f < ff; f++) {
          if (!this.state.filters[f].filter(subFeatures[j].getProperties())) {
            hide = true;
            continue;
          }
        }
        // do not use an observable property, we do not want to notify
        subFeatures[j].hide = hide;
      }
    }
  }
  render() {
    const {formatMessage} = this.props.intl;
    var errorText;
    if (this.state.hasError) {
      errorText = formatMessage(messages.errortext);
    }
    var filters = this.state.filters.map(function(f) {
      var filterName = f.title.replace(/\W+/g, '');
      return (<ListItem key={filterName} rightIcon={<DeleteIcon />} primaryText={f.title} ref={filterName} onTouchTap={this._removeFilter.bind(this, f)} />);
    }, this);
    var actions = [
      <Button buttonType='Flat' label={formatMessage(messages.closebutton)} onTouchTap={this.close.bind(this)} />
    ];
    return (
      <Dialog inline={this.props.inline} className={classNames('sdk-component filter-modal', this.props.className)} actions={actions} title={formatMessage(messages.title, {layer: this.props.layer.get('title')})} modal={true} open={this.props.open} onRequestClose={this.close.bind(this)}>
        <TextField name='filter' errorText={errorText} style={{width: 512}} ref='filterTextBox' />
        <FilterHelp intl={this.props.intl} />
        <Button buttonStyle={{float: 'right', top: -45}} label={formatMessage(messages.addfiltertext)} onTouchTap={this._addFilter.bind(this)} />
        <List>
          {filters}
        </List>
      </Dialog>
    );
  }
}

export default injectIntl(FilterModal);
