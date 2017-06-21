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

/** Provide an option for non-SVG icons which
 *  come from the search results.
 */
export default class ImgIcon extends React.PureComponent {
  static propTypes = {
    /**
     * The source of the image for the icon
     */
    src: React.PropTypes.string,
    /**
     * Style config.
     */
    style: React.PropTypes.object
  }

  render() {
    // when used in components like a ListItem
    //  a number of styles will get set to position and
    //  size the icon appropriately for the view.
    const iconStyle = Object.assign({
      display: 'inline-block',
      width: '24px',
      height: '24px',
      overflow: 'hidden'
    }, this.props.style);

    return (
      <div style={iconStyle}>
        <img width='100%' src={this.props.src} />
      </div>
    );
  }
}


