/* global it, describe, expect */

import React from 'react';
import { shallow } from 'enzyme';

import SdkPopup from '../../../src/components/map/popup';

describe('Popup component', () => {
  it('should close', () => {
    const wrapper = shallow(<SdkPopup coordinate={[0, 0]} closeable><div>foo</div></SdkPopup>);
    const popup = wrapper.instance();
    wrapper.find('.sdk-popup-closer').simulate('click');
    expect(popup.state.closed).toBe(true);
  });
});
