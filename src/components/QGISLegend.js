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
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import LayerStore from '../stores/LayerStore';
import Button from './Button';
import LegendIcon from 'material-ui/svg-icons/image/image';
import Paper from 'material-ui/Paper';
import {List, ListItem} from 'material-ui/List';
import './QGISLegend.css';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

const messages = defineMessages({
  buttontitle: {
    id: 'qgislegend.buttontitle',
    description: 'Title to display on hover of the QGIS legend button',
    defaultMessage: 'Legend'
  }
});

/**
 * A component that shows a legend based on artefacts created by the QGIS plugin Web Application Builder.
 *
 * ```javascript
 * var legendData = {
 *   'geo20130827100512660': [
 *     {
 *      'href': '0_1.png',
 *       'title': 'Hill_111'
 *     }, {
 *       'href': '0_2.png',
 *       'title': 'Hill_112'
 *     }
 *   ],
 *   'pt120130827095302041': [
 *     {
 *       'href': '2_0.png',
 *       'title': '85.0-116.84'
 *     }, {
 *       'href': '2_1.png',
 *       'title': '116.84-148.68'
 *     }
 *   ]
 * };
 * ```
 *
 * ```xml
 * <QGISLegend map={map} legendBasePath='./resources/legend/' legendData={legendData} pullRight/>
 * ```
 */
class QGISLegend extends React.PureComponent {
  static propTypes = {
    /**
     * The map from which to extract the layers.
     */
    map: React.PropTypes.instanceOf(ol.Map).isRequired,
    /**
     * The base path (relative url) to use for finding the artefacts.
     */
    legendBasePath: React.PropTypes.string,
    /**
     * The label and image to use per layer. The object is keyed by layer name currently. For example: {'swamp': [['', '4_0.png']]}.
     */
    legendData: React.PropTypes.object.isRequired,
    /**
     * Style for the button.
     */
    style: React.PropTypes.object,
    /**
     * Should we expand on startup of the application?
     */
    showExpandedOnStartup: React.PropTypes.bool,
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
    legendBasePath: './legend/',
    showExpandedOnStartup: false
  };

  constructor(props, context) {
    super(props);
    LayerStore.bindMap(this.props.map);
    this.state = {
      muiTheme: context.muiTheme || getMuiTheme(),
      visible: this.props.showExpandedOnStartup
    };
  }
  componentWillMount() {
    this._onChangeCb = this._onChange.bind(this);
    LayerStore.addChangeListener(this._onChangeCb);
    this._onChange();
  }
  componentWillUnmount() {
    LayerStore.removeChangeListener(this._onChangeCb);
  }
  _onChange() {
    this.setState(LayerStore.getState());
  }
  _hidePanel() {
    this.setState({visible: false});
  }
  _showPanel() {
    this.setState({visible: true});
  }
  _togglePanel() {
    this.setState({visible: !this.state.visible});
  }
  _renderItems(legendData, legendBasePath) {
    var legendNodes = [];
    var symbolFunc = function(symbol) {
      var src = legendBasePath + symbol.href;
      return (<ListItem key={symbol.title} primaryText={symbol.title} leftIcon={<img src={src}></img>} />);
    };
    for (var id in legendData) {
      var layer = LayerStore.findLayer(id);
      var title = layer.get('title');
      if (title !== null && layer.getVisible()) {
        var symbols = legendData[id].map(symbolFunc);
        legendNodes.push(
          <ListItem initiallyOpen={true} key={id} nestedItems={symbols} primaryText={title} />
        );
      }
    }
    return (
      <List>
        {legendNodes}
      </List>
    );
  }
  render() {
    const {formatMessage} = this.props.intl;
    var divClass = {
      'legend': true,
      'shown': this.state.visible,
      'sdk-component': true,
      'qgis-legend': true
    };
    var items = this._renderItems(this.props.legendData, this.props.legendBasePath);
    return (
      <div className={classNames(divClass, this.props.className)}>
        <Button buttonType='Action' mini={true} secondary={true} className='legendbutton' tooltip={formatMessage(messages.buttontitle)} onTouchTap={this._togglePanel.bind(this)}><LegendIcon /></Button>
        <Paper zDepth={0} className='legend-panel'>{items}</Paper>
      </div>
    );
  }
}

export default injectIntl(QGISLegend);
