import React from 'react';
import debounce from  'debounce';
import Slider from 'material-ui/Slider';
import classNames from 'classnames';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import ol from 'openlayers';

/**
 * Horizontal slider to allow zooming the map. Make sure that the containing div has a size.
 *
 * ```xml
 * <ZoomSlider />
 * ```
 */
class ZoomSlider extends React.PureComponent {
  static propTypes = {
    /**
     * Refresh rate in ms for handling changes from the slider.
     */
    refreshRate: React.PropTypes.number,
    /**
     * Style config.
     */
    style: React.PropTypes.object,
    /**
    * Css class name to apply on the root element of this component.
    */
    className: React.PropTypes.string
  };

  static defaultProps = {
    refreshRate: 100,
    style: {
      height: 124
    }
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
    this._onChange = debounce(this._onChange, this.props.refreshRate);
  }
  getChildContext() {
    return {muiTheme: this._muiTheme};
  }

  getResolutionFn() {
    return (new ol.View({projection: this.props.map.config.projection})).getResolutionForValueFunction();
  }

  _getValue(resolution) {
    const rez_fn = this.getResolutionFn();
    var minResolution = rez_fn(1);
    var maxResolution = rez_fn(0);
    var max = Math.log(maxResolution / minResolution) / Math.log(2);
    return 1 - ((Math.log(maxResolution / resolution) / Math.log(2)) / max);
  }

  _onChange(evt, value) {
    const rez_fn = this.getResolutionFn();
    var resolution = rez_fn(value);
    this.props.setView({
      resolution: resolution
    });
  }
  render() {
    if (this.props.map.view.resolution) {
      return (
        <Slider style={this.props.style}
          className={classNames('sdk-component zoom-slider', this.props.className)}
          onChange={this._onChange.bind(this)}
          value={this._getValue(this.props.map.view.resolution)} />
      );
    } else {
      return false;
    }
  }
}


export default ZoomSlider;
