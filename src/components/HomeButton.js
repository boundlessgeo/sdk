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
import {connect} from 'react-redux';

import {defineMessages, injectIntl, intlShape} from 'react-intl';
import classNames from 'classnames';
import Button from './Button';
import HomeIcon from 'material-ui/svg-icons/maps/zoom-out-map';

import {setView} from '../actions/MapActions';

const messages = defineMessages({
  buttontitle: {
    id: 'homebutton.buttontitle',
    description: 'Title for the home button',
    defaultMessage: 'Zoom to the initial extent'
  }
});

/**
 * A button to go back to the initial extent of the map.
 *
 * ```xml
 * <HomeButton map={map} />
 * ```
 *
 * ![Home Button](../HomeButton.png)
 */
class HomeButton extends React.PureComponent {
  static propTypes = {
    /**
     * Position of the tooltip.
     */
    tooltipPosition: React.PropTypes.oneOf(['bottom', 'bottom-right', 'bottom-left', 'right', 'left', 'top-right', 'top', 'top-left']),
    /**
     * Center Point for the 'home' view.
     */
    center: React.PropTypes.arrayOf(React.PropTypes.number),
    /**
     * The default view can be specified with a zoom level.
     */
    zoom: React.PropTypes.number,
    /**
     * Style config.
     */
    style: React.PropTypes.object,
    /**
     * Css class name to apply on the root element of this component.
     */
    className: React.PropTypes.string,
    /**
     * @ignore
     */
    intl: intlShape.isRequired
  };

  constructor(props) {
    super(props);

    // default the view to null
    let view = null;

    // the state can be seeded automatically or manually,
    // when center and zoom are set then that is used for
    // the default view.
    if (props.center) {
      view = {
        center: props.center,
        zoom: props.zoom
      };
    }

    this.state = {
      view
    };

    this._goHome = this._goHome.bind(this);
  }

  _goHome() {
    // helpful hint...
    if (this.state.view === null) {
      // TODO: There should be a supported way of notifying the user
      //       of a misconfiguration.
      // console.error('No default "home" view has been set.');
    } else {
      // short hand the view
      const v = this.state.view;
      // set the view using the center and zoom
      this.props.dispatch(setView(v));
    }
  }

  componentWillUpdate(nextProps, nextState) {
    // on the first update when there is a view available,
    //  set the view for this state.
    if (nextProps.map.view && this.state.view === null && nextState.view === null) {
      this.setState({view: Object.assign({}, nextProps.map.view)});
    }
  }

  render() {
    const {formatMessage} = this.props.intl;
    return (
      <Button style={this.props.style} tooltipPosition={this.props.tooltipPosition} buttonType='Action' mini={true} secondary={true} className={classNames('sdk-component home-button', this.props.className)} tooltip={formatMessage(messages.buttontitle)} onTouchTap={this._goHome} ><HomeIcon /></Button>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    map: state.mapState
  }
}

export default connect(mapStateToProps)(injectIntl(HomeButton));
