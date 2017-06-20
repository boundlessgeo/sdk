/* global describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {IntlProvider} from 'react-intl';

import '../polyfills';

import BoundlessSdk from '../../src/components/BoundlessSdk';
import GeocodingResults from '../../src/components/GeocodingResults';


var mockSearchResults = [
    {
      'place_id': '171403811',
      'licence': 'Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright',
      'osm_type': 'relation',
      'osm_id': '62607',
      'boundingbox': [
        '50.9378508',
        '53.0416917',
        '10.5608128',
        '13.1868819'
      ],
      'lat': '51.908526',
      'lon': '11.4939134',
      'display_name': 'Saxony-Anhalt, Germany',
      'class': 'boundary',
      'type': 'administrative',
      'importance': 0.67575017594291,
      'icon': 'http://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png',
      'address': {
        'state': 'Saxony-Anhalt',
        'country': 'Germany',
        'country_code': 'de'
      }
    },
    {
      'place_id': '171509342',
      'licence': 'Data © OpenStreetMap contributors, ODbL 1.0. http://www.openstreetmap.org/copyright',
      'osm_type': 'relation',
      'osm_id': '535880',
      'boundingbox': [
        '-0.2135137',
        '1.9257601',
        '6.260642',
        '7.6704783'
      ],
      'lat': '0.8875498',
      'lon': '6.9648718',
      'display_name': 'São Tomé and Príncipe',
      'class': 'boundary',
      'type': 'administrative',
      'importance': 0.54573201539355,
      'icon': 'http://nominatim.openstreetmap.org/images/mapicons/poi_boundary_administrative.p.20.png',
      'address': {
        'country': 'São Tomé and Príncipe',
        'country_code': 'st'
      }
    }];

describe('GeocodingResults', function() {

  it('creates a geocoding-results', function() {
    var container = document.createElement('div');

    ReactDOM.render((
      <div>
        <IntlProvider locale="en">
        <BoundlessSdk>
          <MuiThemeProvider muiTheme={getMuiTheme()}>
            <GeocodingResults show={true} results={mockSearchResults}/>
          </MuiThemeProvider>
        </BoundlessSdk>
        </IntlProvider>
      </div>
    ), container);

    var geocodingResults = container.querySelectorAll('.locationResult');
    assert.equal(geocodingResults.length, 2);
    ReactDOM.unmountComponentAtNode(container);
  });

});
