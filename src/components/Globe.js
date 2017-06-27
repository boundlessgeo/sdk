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
import GlobeIcon from 'material-ui/svg-icons/action/three-d-rotation';
import MapIcon from 'material-ui/svg-icons/maps/map.js';
import {setRenderer} from '../actions/MapActions';

const messages = defineMessages({
  maptext: {
    id: 'globe.maptext',
    description: 'Tooltip to show to switch to map (2D) mode',
    defaultMessage: 'Switch to map (2D)'
  },
  globetext: {
    id: 'globe.globetext',
    description: 'Tooltip to show to switch to globe (3D) mode',
    defaultMessage: 'Switch to globe (3D)'
  }
});

/**
 * Adds a button to toggle 3D mode.
 *
 * ```xml
 * <Globe map={map} />
 * ```
 */
class Globe extends React.PureComponent {
  static propTypes = {
    /**
     * Resolution at which to hide the scalebar in 3D mode
     */
    hideScalebar: React.PropTypes.number,
    /**
     * Position of the tooltip.
     */
    tooltipPosition: React.PropTypes.oneOf(['bottom', 'bottom-right', 'bottom-left', 'right', 'left', 'top-right', 'top', 'top-left']),
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
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    // TODO: This lets various components know which render
    //       is intended to be used (3d vs 2d) but this may
    //       need to be updated in the future to be more explict,
    //       e.g.: Cesium vs OL vs Leaflet.
    let next_renderer = '3d';
    if (this.props.map.renderer === '3d') {
      next_renderer = '2d';
    }
    // dispatch the render change
    this.props.dispatch(setRenderer(next_renderer));
  }

  render() {
    const {formatMessage} = this.props.intl;
    let icon, tooltip;

    if (this.props.map.renderer === '3d') {
      tooltip = formatMessage(messages.maptext);
      icon = <MapIcon />;
    } else {
      tooltip = formatMessage(messages.globetext);
      icon = <GlobeIcon />;
    }

    return (
      <Button style={this.props.style}
        className={classNames('sdk-component globe', this.props.className)}
        tooltip={tooltip}
        tooltipPosition={this.props.tooltipPosition}
        buttonType='Action'
        mini={true} secondary={true}
        onTouchTap={this.onClick}>
          {icon}
      </Button>
    );
  }
}

const mapPropsToState = (state) => {
  return {
    map: state.mapState
  }
}

export default connect(mapPropsToState)(injectIntl(Globe));
