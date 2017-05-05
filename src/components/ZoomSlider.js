import React from 'react';
import ol from 'openlayers';
import debounce from  'debounce';
import Slider from 'material-ui/Slider';
import classNames from 'classnames';

/**
 * Horizontal slider to allow zooming the map. Make sure that the containing div has a size.
 *
 * ```xml
 * <ZoomSlider map={map} />
 * ```
 */
export default class ZoomSlider extends React.PureComponent {
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
     * The map to use.
     */
    map: React.PropTypes.instanceOf(ol.Map).isRequired,
    /**
     * Css class name to apply on the root element of this component.
     */
    className: React.PropTypes.string
  };

  static defaultProps = {
    refreshRate: 100
  };

  constructor(props) {
    super(props);
    this.state = {};
    this._onChange = debounce(this._onChange, this.props.refreshRate);
  }
  componentDidMount() {
    this.props.map.getView().on('change:resolution', this._handleChangeResolution, this);
    this._handleChangeResolution();
  }
  componentWillUnmount() {
    this.props.map.getView().un('change:resolution', this._handleChangeResolution, this);
  }
  _handleChangeResolution() {
    this.setState({
      value: this._getValue(this.props.map.getView().getResolution())
    });
  }
  _getValue(resolution) {
    var view = this.props.map.getView();
    var maxResolution = view.getMaxResolution();
    var minResolution = view.getMinResolution();
    var max = Math.log(maxResolution / minResolution) / Math.log(2);
    return 1 - ((Math.log(maxResolution / resolution) / Math.log(2)) / max);
  }
  _onChange(evt, value) {
    var map = this.props.map;
    var view = map.getView();
    var maxResolution = view.getMaxResolution();
    var minResolution = view.getMinResolution();
    var max = Math.log(maxResolution / minResolution) / Math.log(2);
    var resolution = maxResolution / Math.pow(2, (1 - value) * max);
    view.setResolution(view.constrainResolution(resolution));
  }
  render() {
    return (
      <Slider style={this.props.style} onChange={this._onChange.bind(this)} value={this.state.value} className={classNames('sdk-component zoom-slider', this.props.className)}/>
    );
  }
}
