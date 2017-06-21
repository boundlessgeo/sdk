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
import ol from 'openlayers';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import ArrowLeft from 'material-ui/svg-icons/hardware/keyboard-arrow-left';
import ArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import Carousel from 'nuka-carousel';
import Button from './Button';
import Dots from './BookmarkDots.js';
import './Bookmarks.css';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

const messages = defineMessages({
  dropdowntext: {
    id: 'bookmarks.dropdowntext',
    description: 'Text to use on the Bookmarks drop down',
    defaultMessage: 'Bookmarks'
  }
});


/**
 * Adds the ability to retrieve spatial bookmarks.
 * A spatial bookmark consists of a name, an extent and a description. Extent needs to be in the view projection.
 *
 * ```xml
 * <Bookmarks introTitle='Paris bakeries' introDescription='Explore the best bakeries of the capital of France' map={map} bookmarks={[{name: 'foo1', description: 'description1', extent: [259562, 6254560, 260675, 6256252]}, {name: 'foo2', description: 'description2', extent: [258703, 6248811, 259816, 6250503]}]} />
 * ```
 */
class Bookmarks extends React.PureComponent {
  static propTypes = {
    /**
     * @ignore
     */
    intl: intlShape.isRequired,
    /**
     * Css class name to apply on the menu or the div.
     */
    className: React.PropTypes.string,
    /**
     * Style config.
     */
    style: React.PropTypes.object,
    /**
     * The bookmark data. An array of objects with name (string, required),
     * description (string, required), center coordinate (array of two numbers, required),
     * and zoom (number, required) keys.
     */
    bookmarks: React.PropTypes.arrayOf(React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      description: React.PropTypes.string.isRequired,
      center: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
      resolution: React.PropTypes.number.isRequired
    })).isRequired,

    /**
     * Should the scroller auto scroll?
     */
    autoplay: React.PropTypes.bool,
    /**
     * Delay between each auto scoll in ms.
     */
    autoplaySpeed: React.PropTypes.number,
    /**
     * Should we animate the pan and zoom operation?
     */
    animatePanZoom: React.PropTypes.bool,
    /**
     * The duration of the animation in milleseconds. Only relevant if animatePanZoom is true.
     */
    animationDuration: React.PropTypes.number,
    /**
     * Should we show indicators? These are dots to navigate the bookmark pages.
     */
    dots: React.PropTypes.bool,
    /**
     * The title on the introduction (first) page of the bookmarks.
     */
    introTitle: React.PropTypes.string,
    /**
     * The description of the introduction (first) page of the bookmarks.
     */
    introDescription: React.PropTypes.string,
    /**
     * Display as a menu drop down list.
     */
    menu: React.PropTypes.bool,
    /**
     * Animation duration.
     */
    speed: React.PropTypes.number,
    /**
     *   Should we display a marker for the bookmark? Animation duration.
     */
    showMarker: React.PropTypes.bool,
    /**
     * Url to the marker image to use for bookmark position.
     */
    markerUrl: React.PropTypes.string,
    /**
     * Used to hardcode the slider width. Accepts any string dimension value such as "80%" or "500px".
     */
    width: React.PropTypes.string,
    /**
     * Sets infinite wrapAround mode. Defaults to true
     */
    wrapAround: React.PropTypes.bool
  };

  static defaultProps = {
    autoplay: false,
    autoplayInterval: 3000,
    animatePanZoom: true,
    dots: true,
    introTitle: '',
    introDescription: '',
    animationDuration: 500,
    menu: false,
    showMarker: true,
    markerUrl: './resources/marker.png',
    wrapAround: true,
    width: '400px'
  };

  static contextTypes = {
    muiTheme: React.PropTypes.object
  }

  static childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired
  };

  constructor(props, context) {
    super(props);
    this._muiTheme = context.muiTheme || getMuiTheme();
    this.state = {
      value: null
    }
  }
  getChildContext() {
    return {muiTheme: this._muiTheme};
  }

  componentDidMount() {
    if (this.props.showMarker) {
      this._layer = new ol.layer.Vector({
        title: null,
        managed: false,
        style: new ol.style.Style({
          image: new ol.style.Icon({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            opacity: 0.75,
            src: this.props.markerUrl
          })
        }),
        source: new ol.source.Vector({wrapX: false})
      });
      // TODO: Add layer when addlayer action is in place
      //this.map.addLayer(this._layer);
    }
  }

  _handleChange(evt, value) {
    var bookmark;
    for (var i = 0, ii = this.props.bookmarks.length; i < ii; ++i) {
      if (this.props.bookmarks[i].name === value) {
        bookmark = this.props.bookmarks[i];
        let view = {center: bookmark.center, resolution: bookmark.resolution}
        this.props.setView(view);
      }
    }
    this.setState({value: value});
    //this._selectBookmark(bookmark);
  }

/*TODO: Add animation back into change view action, probably in Map componentDidMount
  _selectBookmark(bookmark) {
    var view = this.map.getView();
    var center, animateOptions;
    if (bookmark) {
      if (this.props.animatePanZoom) {
        animateOptions = {
          duration: this.props.animationDuration
        };
      }
      var extent = bookmark.extent;
      view.fit(extent, animateOptions);
      center = ol.extent.getCenter(extent);
    } else {
      if (this.props.animatePanZoom) {
        view.animate({
          center: this._center,
          resolution: this._resolution,
          duration: this.props.animationDuration
        });
      } else {
        view.setCenter(this._center);
        view.setResolution(this._resolution);
      }
      center = this._center;
    }
    if (this.props.showMarker) {
      var source = this._layer.getSource();
      source.clear();
      if (bookmark) {
        var feature = new ol.Feature({geometry: new ol.geom.Point(center)});
        source.addFeature(feature);
      }
    }
  }
  */
  _afterChange(idx) {
    var bookmark;
    if (idx !== 0) {
      bookmark = this.props.bookmarks[idx - 1];
      let view = {center: bookmark.center, resolution: bookmark.resolution}
      this.props.setView(view);
    }
    //this._selectBookmark(bookmark);
  }
  _decorator = [
    {
      component: class navPrev extends React.Component {
        static propTypes = {
          previousSlide: React.PropTypes.func.isRequired
        }
        render() {
          function getNavStyles() {
            return {margin: '40px 0 0 0'};
          }
          return <div style = {getNavStyles()} onClick = {this.props.previousSlide} className='navPrev'><ArrowLeft/></div>;
        }
      },
      position: 'CenterLeft'
    }, {
      component: class navNext extends React.Component {
        static propTypes = {
          nextSlide: React.PropTypes.func.isRequired
        }
        render() {
          function getNavStyles() {
            return {margin: '40px 0 0 0'};
          }
          return <div style = {getNavStyles()} onClick = {this.props.nextSlide} className='navNext'><ArrowRight/></div>
        }
      },
      position: 'CenterRight'
    }
  ];

  render() {
    const {formatMessage} = this.props.intl;
    if (this.props.menu === true) {
      var menuChildren = this.props.bookmarks.map(function(bookmark) {
        return (
          <MenuItem
            key = { bookmark.name }
            value = { bookmark.name }
            primaryText = { bookmark.name }/>
        );
      }, this);
      return (
        <IconMenu
          anchorOrigin = {{horizontal: 'left',vertical: 'top'}}
          targetOrigin = {{horizontal: 'left',vertical: 'top'}}
          className = { classNames('sdk-component story-panel-menu', this.props.className) }
          iconButtonElement = { <Button buttonType='Icon' iconClassName='headerIcons fa fa-bookmark' tooltip = {formatMessage(messages.dropdowntext)}/>}
          value={this.state.value}
          onChange={this._handleChange.bind(this)}>
            { menuChildren }
        </IconMenu>
      );
    } else {
      let carouselProps = {...this.props};
      carouselProps.autoplayInterval = this.props.autoplaySpeed;
      let Decorators = this._decorator;
      var getHTML = function(bookmark) {
        return {__html: bookmark.description};
      };
      var carouselChildren = this.props.bookmarks.map(function(bookmark) {
        return (
          <div key={bookmark.name} >
            <h2> {bookmark.name} </h2>
            <div dangerouslySetInnerHTML={getHTML(bookmark)} className="slider-box"></div>
          </div>
          );
      });
      carouselChildren.unshift(
        <div key = 'intro' >
          <h2> { this.props.introTitle } </h2>
          <p> { this.props.introDescription } </p>
        </div>
      );
      if (this.props.dots) {
        Decorators.push({component: Dots, position: 'BottomCenter'});
      }
      return (
        <div style={this.props.style} className = { classNames('sdk-component story-panel', this.props.className) } >
          <Carousel { ...carouselProps }
            decorators = { Decorators }
            arrows = { true }
            afterSlide = { this._afterChange.bind(this) }
            framePadding = "0px 20px 38px 20px" >
              { carouselChildren }
          </Carousel>
        </div>
      );
    }
  }
}

export default injectIntl(Bookmarks);
