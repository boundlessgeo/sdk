/* global it, describe, expect, spyOn, beforeEach */

import React from 'react';
import { shallow, mount } from 'enzyme';

import { createStore, combineReducers } from 'redux';
import MapReducer from '../../src/reducers/map';
import { setView } from '../../src/actions/map';

import SdkHashHistory, { HashHistory } from '../../src/components/history';

describe('test the HashHistory component', () => {
  it('should render the components without error', () => {
    shallow(<HashHistory />);
  });

  it('should change the window hash when x,y, or z change', () => {
    const wrapper = shallow(<HashHistory />);

    // defaults to center=[0,0], zoom=1
    expect(window.location.hash).toBe('#x=0.00000&y=0.00000&z=1&r=0');

    // update x
    wrapper.setProps({ map: { center: [-1, 0], zoom: 1 } });
    wrapper.update();
    expect(window.location.hash).toBe('#x=-1.00000&y=0.00000&z=1&r=0');

    // update y
    wrapper.setProps({ map: { center: [-1, -1], zoom: 1 } });
    wrapper.update();
    expect(window.location.hash).toBe('#x=-1.00000&y=-1.00000&z=1&r=0');

    // update z
    wrapper.setProps({ map: { center: [-1, -1], zoom: 11 } });
    wrapper.update();
    expect(window.location.hash).toBe('#x=-1.00000&y=-1.00000&z=11&r=0');
  });

  it('should update the view when x,y,z changes', () => {
    const props = {
      setView: () => { },
    };
    spyOn(props, 'setView');
    mount(<HashHistory {...props} />);

    // simulate a hash change event.
    window.location.hash = '#x=200&y=200&z=22&r=0';
    window.dispatchEvent(new Event('hashchange'));

    // setView is the function property to handle
    //  changing the view when the hash has changed.
    expect(props.setView).toHaveBeenCalled();
  });

  it('should fail gracefully when there is an invalid center value', () => {
    mount(<HashHistory />);
    expect(window.location.hash).toBe('#x=0.00000&y=0.00000&z=1&r=0');
    window.location.hash = '#x=chicken&y=nuggets';
    window.dispatchEvent(new Event('hashchange'));
  });
});

describe('change the connected HashHistory', () => {
  let store = null;

  beforeEach(() => {
    store = createStore(combineReducers({
      map: MapReducer,
    }));
  });

  it('sets the view when the hash changes', () => {
    // mount a connected HashHistory component.
    mount(<SdkHashHistory store={store} />);

    // simulate a hash change event.
    window.location.hash = '#x=200&y=200&z=22&r=0';
    window.dispatchEvent(new Event('hashchange'));

    const st = store.getState();
    expect(st.map.center).toEqual([200, 200]);
    expect(st.map.zoom).toEqual(22);
  });

  it('changes the hash when the view changes', () => {
    // mount a connected HashHistory component.
    mount(<SdkHashHistory store={store} />);
    store.dispatch(setView([100, 100], 10));
    expect(window.location.hash).toBe('#x=100.00000&y=100.00000&z=10&r=0');
  });
});
