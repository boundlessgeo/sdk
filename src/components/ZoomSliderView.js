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
    refreshRate: 100
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
    return 1 - (resolution / rez_fn(1));
  }

  _onChange(evt, value) {
    const rez_fn = this.getResolutionFn();
    this.props.setView({
      resolution: rez_fn(1 - value)
    });
  }
  render() {
    if (this.props.resolution) {
      return (
        <Slider style={this.props.style} className={classNames('sdk-component zoom-slider', this.props.className)} onChange={this._onChange.bind(this)} value={this._getValue(this.props.resolution)} />
      );
    } else {
      return false;
    }
  }
}


export default ZoomSlider;
