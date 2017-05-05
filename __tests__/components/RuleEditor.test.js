/* global describe, it */

import React from 'react';
import ReactDOM from 'react-dom';
import {assert} from 'chai';
import intl from '../mock-i18n';
import 'phantomjs-polyfill-object-assign';
import RuleEditor from '../../src/components/RuleEditor';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TestUtils from 'react-addons-test-utils';

describe('RuleEditor', function() {

  it('fires onChange', function() {
    var container = document.createElement('div');
    var onChange = function(state) {
      assert.equal(state.labelAttribute, null);
    };
    var attributes = ['foo', 'bar'];
    ReactDOM.render((
      <MuiThemeProvider muiTheme={getMuiTheme()}>
        <RuleEditor attributes={attributes} visible={true} onChange={onChange} intl={intl} />
      </MuiThemeProvider>
    ), container);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('does not fire onChange if visible is false', function() {
    var container = document.createElement('div');
    var called = false;
    var onChange = function(state) {
      called = true;
    };
    var attributes = ['foo', 'bar'];
    ReactDOM.render((
      <MuiThemeProvider muiTheme={getMuiTheme()}>
        <RuleEditor attributes={attributes} visible={false} onChange={onChange} intl={intl} />
      </MuiThemeProvider>
    ), container);
    assert.equal(called, false);
    ReactDOM.unmountComponentAtNode(container);
  });

  it('renders the rule editor', function() {
    const renderer = TestUtils.createRenderer();
    var onChange = function() {};
    var attributes = ['foo', 'bar'];
    renderer.render(<RuleEditor attributes={attributes} intl={intl} onChange={onChange}/>);
    const actual = renderer.getRenderOutput().props.className;
    const expected = 'sdk-component rule-editor';
    assert.equal(actual, expected);
  });

});
