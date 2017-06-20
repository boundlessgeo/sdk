import React from 'react';
import ol from 'openlayers';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import Dialog from 'material-ui/Dialog';
import Button from './Button';
import Toggle from 'material-ui/Toggle';
import classNames from 'classnames';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

const messages = defineMessages({
  dd: {
    id: 'zoomtolonlat.dd',
    description: 'Abbreviation for Decimal Degrees',
    defaultMessage: 'DD'
  },
  dms: {
    id: 'zoomtolonlat.dms',
    description: 'Abbreviation for degrees / minutes / seconds',
    defaultMessage: 'DMS'
  },
  west: {
    id: 'zoomtolatlon.west',
    description: 'Label for West direction',
    defaultMessage: 'West'
  },
  east: {
    id: 'zoomtolatlon.east',
    description: 'Label for East direction',
    defaultMessage: 'East'
  },
  north: {
    id: 'zoomtolatlon.north',
    description: 'Label for North direction',
    defaultMessage: 'North'
  },
  south: {
    id: 'zoomtolatlon.south',
    description: 'Label for South direction',
    defaultMessage: 'South'
  },
  modaltitle: {
    id: 'zoomtolatlon.modaltitle',
    description: 'Title for the modal dialog',
    defaultMessage: 'Zoom to latitude/longitude'
  },
  ddtitle: {
    id: 'zoomtolatlon.ddtitle',
    description: 'Title for the decimal degrees tab',
    defaultMessage: 'Decimal degrees (DD)'
  },
  dmstitle: {
    id: 'zoomtolatlon.dmstitle',
    description: 'Title for the degrees minutes seconds tab',
    defaultMessage: 'Degrees minutes seconds (DMS)'
  },
  buttontitle: {
    id: 'zoomtolatlon.buttontitle',
    description: 'Title for the button',
    defaultMessage: 'Zoom to latitude / longitude coordinates'
  },
  directionlabel: {
    id: 'zoomtolatlon.directionlabel',
    description: 'Label for the direction select field',
    defaultMessage: 'Direction'
  },
  latitudelabel: {
    id: 'zoomtolatlon.latitudelabel',
    description: 'Label for the latitude input field',
    defaultMessage: 'Latitude'
  },
  degreeslabel: {
    id: 'zoomtolatlon.degreeslabel',
    description: 'Label for the degrees input field',
    defaultMessage: 'D'
  },
  minuteslabel: {
    id: 'zoomtolatlon.minuteslabel',
    description: 'Label for the minutes input field',
    defaultMessage: 'M'
  },
  secondslabel: {
    id: 'zoomtolatlon.secondslabel',
    description: 'Label for the seconds input field',
    defaultMessage: 'S'
  },
  longitudelabel: {
    id: 'zoomtolatlon.longitudelabel',
    description: 'Label for the longitude input field',
    defaultMessage: 'Longitude'
  },
  zoombuttontext: {
    id: 'zoomtolatlon.zoombuttontext',
    description: 'Text for zoom button',
    defaultMessage: 'Zoom'
  },
  closebuttontext: {
    id: 'zoomtolatlon.closebuttontext',
    description: 'Text for close button',
    defaultMessage: 'Cancel'
  }
});


/**
 * Component that allows zooming the map to a lat / lon position.
 *
 * ```xml
 * <ZoomToLatLon zoom={12} />
 * ```
 */
class ZoomToLatLon extends React.PureComponent {
  static propTypes = {
    /**
     * Style config.
     */
    style: React.PropTypes.object,
    /**
     * The zoom level used when centering the view.
     */
    zoom: React.PropTypes.number,
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
    muiTheme: React.PropTypes.object,
    map: React.PropTypes.instanceOf(ol.Map)
  };

  static childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired
  };

  static defaultProps = {
    zoom: 14
  };

  constructor(props, context) {
    super(props);
    this._muiTheme = context.muiTheme || getMuiTheme();
    this.map = context.map || this.props.map;
    this.state = {
      dms: false,
      londirection: 'E',
      latdirection: 'N'
    };
  }
  getChildContext() {
    return {muiTheme: this._muiTheme};
  }
  openDialog() {
    this.props.openDialog();
  }
  closeDialog() {
    this.props.closeDialog();
  }
  _dmsToDegrees(degrees, minutes, seconds, direction) {
    var dd = degrees + minutes / 60 + seconds / (60 * 60);
    if (direction === 'S' || direction === 'W') {
      dd = dd * -1;
    }
    return dd;
  }
  _zoomToLatLon() {
    var lat, lon;
    if (!this.state.dms) {
      lat = parseFloat(this.refs.lat.getValue());
      lon = parseFloat(this.refs.lon.getValue());
    } else {
      lat = this._dmsToDegrees(
        parseFloat(this.refs.latd.getValue()),
        parseFloat(this.refs.latm.getValue()),
        parseFloat(this.refs.lats.getValue()),
        this.state.latdirection
      );
      lon = this._dmsToDegrees(
        parseFloat(this.refs.lond.getValue()),
        parseFloat(this.refs.lonm.getValue()),
        parseFloat(this.refs.lons.getValue()),
        this.state.londirection
      );
    }
    var view = this.map.getView();
    view.setCenter(ol.proj.fromLonLat([lon, lat], view.getProjection()));
    view.setZoom(this.props.zoom);
    this.closeDialog();
  }
  _onNorthSouthChange(evt, idx, value) {
    this.setState({latdirection: value});
  }
  _onEastWestChange(evt, idx, value) {
    this.setState({londirection: value});
  }
  _onToggle() {
    var dms = this.state.dms;
    this.setState({dms: !dms});
  }
  render() {
    const {formatMessage} = this.props.intl;
    const styles = {
      thumbOff: {
        backgroundColor: this._muiTheme.toggle.thumbOnColor
      },
      trackOff: {
        backgroundColor: this._muiTheme.toggle.trackOnColor
      }
    };
    var actions = [
      <span style={{position: 'absolute', bottom: 10, display: 'flex'}}><span style={{width: 50}}>{formatMessage(messages.dd)}</span><Toggle style={{width: 50}} thumbStyle={styles.thumbOff} trackStyle={styles.trackOff} toggled={this.state.dms} onToggle={this._onToggle.bind(this)}/><span style={{width: 50}}>{formatMessage(messages.dms)}</span></span>,
      <Button primary={true} buttonType='Flat' label={formatMessage(messages.closebuttontext)} onTouchTap={this.closeDialog.bind(this)} />,
      <Button primary={true} buttonType='Flat' label={formatMessage(messages.zoombuttontext)} onTouchTap={this._zoomToLatLon.bind(this)} />
    ];
    var body;
    if (!this.state.dms) {
      body = (<span>
        <TextField ref='lat' floatingLabelFixed={true} floatingLabelText={formatMessage(messages.latitudelabel)} /><br/>
        <TextField ref='lon' floatingLabelFixed={true} floatingLabelText={formatMessage(messages.longitudelabel)} />
      </span>);
    } else {
      body = (<span>
        <p style={{color: this._muiTheme.rawTheme.palette.accent1Color}}>{formatMessage(messages.latitudelabel)}</p>
        <SelectField style={{top: -6, width: 100}} value={this.state.latdirection} onChange={this._onNorthSouthChange.bind(this)} floatingLabelText={formatMessage(messages.directionlabel)}>
          <MenuItem value='N' primaryText={formatMessage(messages.north)} />
          <MenuItem value='S' primaryText={formatMessage(messages.south)} />
        </SelectField>
        <TextField ref='latd' style={{width: 150}} hintText={formatMessage(messages.degreeslabel)} />
        <TextField ref='latm' style={{width: 150}} hintText={formatMessage(messages.minuteslabel)} />
        <TextField ref='lats' style={{width: 150}} hintText={formatMessage(messages.secondslabel)} />
        <br/>
        <p style={{color: this._muiTheme.rawTheme.palette.accent1Color}}>{formatMessage(messages.longitudelabel)}</p>
        <SelectField style={{top: -6, width: 100}} value={this.state.londirection} onChange={this._onEastWestChange.bind(this)} floatingLabelText={formatMessage(messages.directionlabel)}>
          <MenuItem value='W' primaryText={formatMessage(messages.west)} />
          <MenuItem value='E' primaryText={formatMessage(messages.east)} />
        </SelectField>
        <TextField ref='lond' style={{width: 150}} hintText={formatMessage(messages.degreeslabel)} />
        <TextField ref='lonm' style={{width: 150}} hintText={formatMessage(messages.minuteslabel)} />
        <TextField ref='lons' style={{width: 150}} hintText={formatMessage(messages.secondslabel)} />
      </span>);
    }
    return (
      <span style={this.props.style}>
        <Button buttonType='Icon' {...this.props} iconClassName='headerIcons ms ms-zoom-to' className={classNames('sdk-component zoom-to-latlon', this.props.className)} onTouchTap={this.openDialog.bind(this)} tooltip={formatMessage(messages.buttontitle)}/>
        <Dialog actions={actions} open={this.props.open ? this.props.open : false} autoScrollBodyContent={true} onRequestClose={this.closeDialog.bind(this)} modal={true} title={formatMessage(messages.modaltitle)}>
          {body}
        </Dialog>
      </span>
    );
  }
}

export default injectIntl(ZoomToLatLon);
