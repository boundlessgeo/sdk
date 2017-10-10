/* global describe, it, expect */

import * as actions from '../../src/actions/mapbox';
import { MAPBOX } from '../../src/action-types';

describe('Mapbox actions', () => {
  it('should create an action to set configure', () => {
    const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/bright-v8';
    const accessToken = 'pk.foo';
    const expectedAction = {
      type: MAPBOX.CONFIGURE,
      baseUrl,
      accessToken,
    };
    expect(actions.configure({baseUrl, accessToken})).toEqual(expectedAction);
  });
});
