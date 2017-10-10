/* global describe, it, expect */

import * as actions from '../../src/actions/mapbox';
import { MAPBOX } from '../../src/action-types';

describe('Mapbox actions', () => {
  it('should create an action to set the base url', () => {
    const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/bright-v8';
    const expectedAction = {
      type: MAPBOX.SET_BASE_URL,
      baseUrl,
    };
    expect(actions.setBaseUrl(baseUrl)).toEqual(expectedAction);
  });

  it('should create an action to set the access token', () => {
    const accessToken = 'pk.foo';
    const expectedAction = {
      type: MAPBOX.SET_ACCESS_TOKEN,
      accessToken,
    };
    expect(actions.setAccessToken(accessToken)).toEqual(expectedAction);
  });
});
