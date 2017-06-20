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
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import TextField from 'material-ui/TextField';
import {lightWhite, fullWhite} from 'material-ui/styles/colors';
import GeocodingResults from './GeocodingResults';

import util from '../util';

const messages = defineMessages({
  placeholder: {
    id: 'geocoding.placeholder',
    description: 'Placeholder string for the search placename geocoding input field',
    defaultMessage: 'Search placename...'
  }
});

export class Geocoding extends React.Component {
  static propTypes = {
    /**
     * The maximum number of results to return on a search.
     */
    maxResults: React.PropTypes.number,
    /**
     * Css class name to apply on the root element of this component.
     */
    className: React.PropTypes.string,
    /**
     * Style config.
     */
    style: React.PropTypes.object,
    /**
     * @ignore
     */
    intl: intlShape.isRequired,
    /**
     * @ignore
     */
    transformResults: React.PropTypes.func,
    /**
     * Object defining parameters to the search.
     */
    searchParams: React.PropTypes.object,
    /**
     * Url for hte search end point.
     */
    searchUrl: React.PropTypes.string
  }

  static defaultProps = {
    // use the nomantim search url if not given anything else.
    searchUrl: 'http://nominatim.openstreetmap.org/search',
    // normatim style urls.
    searchParams: {
      format: 'json',
      addressdetails: '1',
      limit: '5',
      q: '%QUERY%'
    }
  }

  constructor(props) {
    super(props);

    // seed the state with no results.
    this.state = {
      results: []
    };
  }

  _searchAddress(event) {
    const search_string = event.target.value;
    if (search_string.length > 2) {
      // clone the params and substitute the query string in.
      const params = Object.assign({}, this.props.searchParams);
      for (const key in params) {
        params[key]  = params[key].replace('%QUERY%', search_string);
      }

      // kick off the query.
      return util.fetch(this.props.searchUrl, {params}).then((response) => {
        return response.json();
      }).then((results) => {
        // get the results and transform them if given
        //  a transform function.
        if (typeof (this.props.transformResults) === 'function') {
          results = this.props.transformResults(results);
        }
        // set the results in the state.
        this.setState({results});
      });

    }
  }

  /**
   * When the text field has focus, show the results.
   *
   * @param {Boolean} v focus setting
   */
  focus(v) {
    this.setState({hasFocus: v});
  }

  render() {
    const {formatMessage} = this.props.intl;

    // display of the results list is focus dependent.
    //  When the TextField gets focus it is given the suggestion
    //  to show itself, when any result is clicked then the
    //  list should disappear.
    return (
      <span>
        <TextField
          style={this.props.style}
          className={classNames('sdk-component geocoding headerText', this.props.className)}
          inputStyle= {{color:fullWhite}}
          hintText={formatMessage(messages.placeholder)}
          hintStyle= {{color: lightWhite}}
          onFocus={() => {
            this.focus(true);
          }}
          onChange={this._searchAddress.bind(this)}
          />
        <span onClick={() => {
          this.focus(false);
        }}>
          <GeocodingResults show={this.state.hasFocus} results={this.state.results}/>
        </span>
      </span>
    );
  }
}

const mapStateToProps = function(state) {
  return {}
}

// Use connect to put them together
export default connect(mapStateToProps)(injectIntl(Geocoding));
