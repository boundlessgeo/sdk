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
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import classNames from 'classnames';
import Button from './Button';
import FullScreenIcon from 'material-ui/svg-icons/navigation/fullscreen';

const messages = defineMessages({
  buttontitle: {
    id: 'fullscreen.buttontitle',
    description: 'Title for the fullscreen button',
    defaultMessage: 'Full-screen map'
  }
});

/**
 * A button to enable full-screen mode on the map.
 *
 * ```xml
 * <Fullscreen map={map} />
 * ```
 */
class Fullscreen extends React.PureComponent {
  static propTypes = {
    /**
     * The ol3 map to use.
     */
    map: React.PropTypes.instanceOf(ol.Map).isRequired,
    /**
     * Position of the tooltip.
     */
    tooltipPosition: React.PropTypes.oneOf(['bottom', 'bottom-right', 'bottom-left', 'right', 'left', 'top-right', 'top', 'top-left']),
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
  }
  isFullScreenSupported() {
    var body = document.body;
    return !!(
      body.webkitRequestFullscreen ||
      (body.mozRequestFullScreen && document.mozFullScreenEnabled) ||
      (body.msRequestFullscreen && document.msFullscreenEnabled) ||
      (body.requestFullscreen && document.fullscreenEnabled)
    );
  }
  isFullScreen() {
    return !!(
      document.webkitIsFullScreen || document.mozFullScreen ||
      document.msFullscreenElement || document.fullscreenElement
    );
  }
  requestFullScreen(element) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
  }
  exitFullScreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
  _handleFullScreen() {
    if (!this.isFullScreenSupported()) {
      return;
    }
    var map = this.props.map;
    if (!map) {
      return;
    }
    if (this.isFullScreen()) {
      this.exitFullScreen();
    } else {
      var element = map.getTargetElement();
      this.requestFullScreen(element);
    }
  }
  _goFullscreen() {
    this._handleFullScreen();
  }
  render() {
    const {formatMessage} = this.props.intl;
    return (
      <Button tooltipPosition={this.props.tooltipPosition} buttonType='Action' mini={true} secondary={true} className={classNames('sdk-component full-screen', this.props.className)} tooltip={formatMessage(messages.buttontitle)} onTouchTap={this._goFullscreen.bind(this)} ><FullScreenIcon /></Button>
    );
  }
}

export default injectIntl(Fullscreen);
