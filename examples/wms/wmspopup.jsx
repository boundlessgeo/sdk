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
        content.push(<p key={key}>{keys[j]} : {feature.properties[keys[j]]}</p>);
      }
    }
    return this.renderPopup((
      <div>{ content }</div>
    ));
  }
}

