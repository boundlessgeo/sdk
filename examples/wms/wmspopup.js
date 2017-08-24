import React from 'react';
import SdkPopup from '@boundlessgeo/sdk/components/map/popup';

/**
 * Show the WMS GetFeatureInfo feature in a popup.
 */
export default class WMSPopup extends SdkPopup {
  render() {
    const content = [];
    for (let i = 0, ii = this.props.features.length; i < ii; ++i) {
      const feature = this.props.features[i];
      const keys = Object.keys(feature.properties);
      for (let j = 0, jj = keys.length; j < jj; ++j) {
        const key = `${i}-${keys[j]}`;
        content.push(
          <li key={key}>
            <span className="title">{keys[j]}</span> - <span className="value">{feature.properties[keys[j]]}</span>
          </li>);
      }
    }
    return this.renderPopup((
      <div className="sdk-popup-content">
        <ul>
          { content }
        </ul>
      </div>
    ));
  }
}
