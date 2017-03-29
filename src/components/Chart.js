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
import Button from './Button';
import FeatureStore from '../stores/FeatureStore';
import CloserIcon from 'material-ui/svg-icons/navigation/close';
import c3 from 'c3-windows';
import './c3.min.css';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MenuItem from 'material-ui/MenuItem';
import SelectField from 'material-ui/SelectField';
import Paper from 'material-ui/Paper';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import './Chart.css';

const AGGREGATION_MIN = 0;
const AGGREGATION_MAX = 1;
const AGGREGATION_SUM = 2;
const AGGREGATION_AVG = 3;
const DISPLAY_MODE_FEATURE = 0;
const DISPLAY_MODE_CATEGORY = 1;
const DISPLAY_MODE_COUNT = 2;

const messages = defineMessages({
  combotext: {
    id: 'chart.combotext',
    description: 'Text to use on the Chart drop down',
    defaultMessage: 'Chart Name'
  },
  count: {
    id: 'chart.count',
    description: 'Title of the column which will be used to show feature count',
    defaultMessage: 'Feature count'
  }
});

/**
 * Allow for the creation of charts based on selected features of a layer.
 *
 * ```javascript
 * var charts = [{
 *   title: 'Airports count per use category',
 *   categoryField: 'USE',
 *   layer: 'lyr03',
 *   valueFields: [],
 *   displayMode: 2,
 *   operation: 2
 * }, {
 *   title: 'Forest area total surface',
 *   categoryField: 'VEGDESC',
 *   layer: 'lyr01',
 *   valueFields: ['AREA_KM2'],
 *   displayMode: 1,
 *   operation: 2
 * }];
 * ```
 *
 * ```xml
 * <Chart ref='chartPanel' charts={charts}/>
 * ```
 */
class Chart extends React.Component {
  static propTypes = {
    /**
     * An array of configuration objects. Configuration objects have title, categoryField, layer,
     * valueFields, displayMode and operation keys.
     * title (string, required) is the title to display for the chart.
     * categoryField (string, optional) is the attribute to use as the category.
     * layer (string, required) is the id property of the corresponding layer to use.
     * valueFields (array of string, required) is an array of field names to use for displaying values in the chart.
     * displayMode (enum(0, 1, 2), required) defines how the feature attributes will be used to create the chart. When using a value of 0 (by feature), an element will
     * be added to the chart for each selected feature. When using a value of 1 (by category), selected features will be grouped according to
     * a category defined by the categoryField. When using a value of 2 (count by category) the chart will show the number of features in each
     * category.
     * The statistic function to use when displayMode is by category (1) is defined in the operation (enum(0, 1, 2, 3), optional) key.
     * A value of 0 means MIN, a value of 1 means MAX, a value of 2 means SUM and a value of 3 means AVG (Average).
     */
    charts: React.PropTypes.arrayOf(React.PropTypes.shape({
      title: React.PropTypes.string.isRequired,
      categoryField: React.PropTypes.string,
      layer: React.PropTypes.string.isRequired,
      valueFields: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
      displayMode: React.PropTypes.oneOf([0, 1, 2]).isRequired,
      operation: React.PropTypes.oneOf([0, 1, 2, 3])
    })).isRequired,
    /**
     * Css class name to apply on the menu or div.
     */
    className: React.PropTypes.string,
    /**
     * Callback function when the closer icon is pressed.
     */
    onClose: React.PropTypes.func.isRequired,
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
      chart: this.props.charts[0],
      value: this.props.charts[0].title,
      selected: null,
      muiTheme: context.muiTheme || getMuiTheme()
    };
  }
  componentDidMount() {
    this._onChangeCb = this._onChange.bind(this);
    FeatureStore.addChangeListener(this._onChangeCb);
  }
  componentWillUnmount() {
    FeatureStore.removeChangeListener(this._onChangeCb);
  }
  _onChange() {
    this._storeConfig = FeatureStore.getState();
    this.setState({selected: this._storeConfig[this.state.chart.layer].selected});
  }
  _getColumns() {
    var chart = this.state.chart;
    const {formatMessage} = this.props.intl;
    var i, ii, j, jj, values, cat, key;
    var categoryField = chart.categoryField;
    var valueFields = chart.valueFields;
    var selectedFeatures = this.state.selected ? this.state.selected : [];
    var columns = [['x']];
    if (chart.displayMode === DISPLAY_MODE_COUNT) {
      var count = formatMessage(messages.count);
      columns.push([count]);
    } else {
      for (i = 0, ii = valueFields.length; i < ii; i++) {
        columns.push([valueFields[i]]);
      }
    }
    switch (chart.displayMode) {
      case DISPLAY_MODE_FEATURE:
        for (i = 0, ii = selectedFeatures.length; i < ii; ++i) {
          columns[0].push(selectedFeatures[i].get(categoryField));
          for (j = 0, jj = valueFields.length; j < jj; ++j) {
            columns[j + 1].push(selectedFeatures[i].get(valueFields[j]));
          }
        }
        break;
      case DISPLAY_MODE_CATEGORY:
        values = {};
        for (i = 0, ii = selectedFeatures.length; i < ii; i++) {
          cat = selectedFeatures[i].get(categoryField);
          if (cat !== undefined && cat !== null) {
            cat = cat.toString();
            if (!(cat in values)) {
              values[cat] = [];
              for (j = 0, jj = valueFields.length; j < jj; j++) {
                values[cat].push([selectedFeatures[i].get(valueFields[j])]);
              }
            } else {
              for (j = 0, jj = valueFields.length; j < jj; j++) {
                values[cat][j].push(selectedFeatures[i].get(valueFields[j]));
              }
            }
          }
        }
        for (key in values) {
          columns[0].push(key);
          var v;
          for (i = 0, ii = valueFields.length; i < ii; i++) {
            if (chart.operation === AGGREGATION_SUM || chart.operation === AGGREGATION_AVG) {
              v = 0;
              jj = values[key][i].length;
              for (j = 0; j < jj; ++j) {
                v += values[key][i][j];
              }
              if (chart.operation === AGGREGATION_AVG) {
                v /= jj;
              }
            } else if (chart.operation === AGGREGATION_MIN) {
              Math.min.apply(Math, values[key][i]);
            } else if (chart.operation === AGGREGATION_MAX) {
              Math.max.apply(Math, values[key][i]);
            }
            columns[i + 1].push(v);
          }
        }
        break;
      case DISPLAY_MODE_COUNT:
        values = {};
        for (i = 0, ii = selectedFeatures.length; i < ii; i++) {
          cat = selectedFeatures[i].get(categoryField);
          if (cat !== undefined && cat !== null) {
            cat = cat.toString();
            if (!(cat in values)) {
              values[cat] = 1;
            } else {
              values[cat]++;
            }
          }
        }
        var sorted = [];
        for (key in values) {
          sorted.push([key, values[key]]);
        }
        sorted.sort(function(a, b) {
          return b[1] - a[1];
        });
        for (i = 0, ii = sorted.length; i < ii; i++) {
          columns[0].push(sorted[i][0]);
          columns[1].push(sorted[i][1]);
        }
        break;
      default:
        break;
    }
    return columns;
  }
  _selectChart(evt, idx, value) {
    for (var i = 0, ii = this.props.charts.length; i < ii; ++i) {
      var chart = this.props.charts[i];
      if (chart.title === value) {
        this.setState({
          chart: chart,
          value: value,
          selected: this._storeConfig[chart.layer].selected
        });
        break;
      }
    }
  }
  _onClose() {
    this.props.onClose();
  }
  render() {
    const {formatMessage} = this.props.intl;
    var columns = this._getColumns();
    c3.generate({
      bindto: '#chart',
      data: {
        x: 'x',
        columns: columns,
        type: 'bar'
      },
      padding: {
        right: 30
      },
      axis: {
        x: {
          type: 'category',
          tick: {
            rotate: 70,
            multiline: false
          },
          height: 80
        }
      }
    });
    var options = this.props.charts.map(function(chart, idx) {
      var title = chart.title;
      return (<MenuItem key={idx} value={title} primaryText={title} />);
    });
    return (
      <Paper zDepth={0} className={classNames('sdk-component chart', this.props.className)}>
        <SelectField style={{width: 350}} floatingLabelText={formatMessage(messages.combotext)} floatingLabelFixed={true} value={this.state.value} onChange={this._selectChart.bind(this)}>
          {options}
        </SelectField>
        <Button buttonType='Icon' buttonStyle={{float: 'right'}} style={{'position':'absolute', 'right':'0px', 'top':'0px', 'zIndex':'1000'}} ref="popupCloser" onTouchTap={this._onClose.bind(this)}><CloserIcon /></Button>
        <div id='chart'>
        </div>
      </Paper>
    );
  }
}

export default injectIntl(Chart);
