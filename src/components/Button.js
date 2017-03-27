import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import IconButton from 'material-ui/IconButton';
import classNames from 'classnames';

/**
 * Button with built-in tooltip.
 *
 * ```xml
 * <Button buttonType='Flat' label='Close' tooltip='Close dialog' onTouchTap={this.close.bind(this)} />
 * ```
 */
class Button extends React.PureComponent {
  static propTypes = {
    /**
     * Type of button.
     */
    buttonType: React.PropTypes.oneOf(['Raised', 'Flat', 'Action', 'Icon']),
    /**
     * Position of the tooltip.
     */
    tooltipPosition: React.PropTypes.oneOf(['bottom', 'bottom-right', 'bottom-left', 'right', 'left', 'top-right', 'top', 'top-left']),
    /**
     * Should this button be disabled?
     */
    disabled: React.PropTypes.bool,
    /**
     * Css class name to apply on the span.
     */
    className: React.PropTypes.string,
    /**
     * The tooltip to show for this button.
     */
    tooltip: React.PropTypes.string,
    /**
     * Background color.
     */
    backgroundColor: React.PropTypes.string,
    /**
     * Function to execute when the button is clicked.
     */
    onTouchTap: React.PropTypes.func,
    /**
     * Style config object for the button.
     */
    style: React.PropTypes.object,
    /**
     * Style config object for the wrapping span element.
     */
    buttonStyle: React.PropTypes.object,
    /**
     * @ignore
     */
    children: React.PropTypes.node,
    /**
     * Should this button be mini? Only applies to certain button types.
     */
    mini: React.PropTypes.bool,
    /**
     * Optional icon.
     */
    icon: React.PropTypes.node,
    /**
     * Label to show on the button.
     */
    label: React.PropTypes.string,
    /**
     * Should we use the primary state?
     */
    primary: React.PropTypes.bool,
    /**
     * Should we use the secondary state?
     */
    secondary: React.PropTypes.bool,
    /**
     * Icon style config object.
     */
    iconStyle: React.PropTypes.object
  };

  static childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired
  };

  static defaultProps = {
    buttonType: 'Raised',
    tooltipPosition: 'bottom'
  };

  render() {
    var button, buttonStyle = Object.assign({}, this.props.buttonStyle);
    if (this.props.buttonType === 'Action') {
      button = (<FloatingActionButton iconStyle={this.props.iconStyle} disabled={this.props.disabled} backgroundColor={this.props.backgroundColor} onTouchTap={this.props.onTouchTap} style={this.props.style} children={this.props.children} mini={this.props.mini}  />);
    } else if (this.props.buttonType === 'Flat') {
      button = (<FlatButton disableTouchRipple={true} disabled={this.props.disabled} secondary={this.props.secondary} primary={this.props.primary} onTouchTap={this.props.onTouchTap} icon={this.props.icon} children={this.props.children} label={this.props.label} />);
    } else if (this.props.buttonType === 'Icon') {
      button = (<IconButton disableTouchRipple={true} disabled={this.props.disabled} onTouchTap={this.props.onTouchTap} style={this.props.style} children={this.props.children}/>);
    } else {
      button = (<RaisedButton disableTouchRipple={true} disabled={this.props.disabled} style={this.props.style} secondary={this.props.secondary} onTouchTap={this.props.onTouchTap} icon={this.props.icon} children={this.props.children} label={this.props.label} />);
    }
    var className = {
      'sdk-component': true,
      'sdk-button': true,
      'hint--small': this.props.buttonType !== 'Action'
    };
    className['hint--' + this.props.tooltipPosition] = this.props.tooltip !== undefined;
    return (
      <span style={buttonStyle} className={classNames(className, this.props.className)} aria-label={this.props.tooltip}>
        {button}
      </span>
    );
  }
}

export default Button;
