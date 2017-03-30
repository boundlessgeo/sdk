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
global.React = React;

import ReactDOM from 'react-dom';
global.ReactDOM = ReactDOM;

import ol from 'openlayers';
global.ol = ol;

import {IntlProvider} from 'react-intl';
global.IntlProvider = IntlProvider;

import injectTapEventPlugin from 'react-tap-event-plugin';
global.injectTapEventPlugin = injectTapEventPlugin;

import getMuiTheme from 'material-ui/styles/getMuiTheme';
global.getMuiTheme = getMuiTheme;

import AppBar from 'material-ui/AppBar';
global.AppBar = AppBar;

import {Toolbar, ToolbarGroup, ToolbarSeparator} from 'material-ui/Toolbar';
global.Toolbar = Toolbar;
global.ToolbarGroup = ToolbarGroup;
global.ToolbarSeparator = ToolbarSeparator;

import IconMenu from 'material-ui/IconMenu';
global.IconMenu = IconMenu;

import MenuItem from 'material-ui/MenuItem';
global.MenuItem = MenuItem;

import {Tabs, Tab} from 'material-ui/Tabs';
global.Tabs = Tabs;
global.Tab = Tab;

import Bookmarks from './components/Bookmarks';
global.Bookmarks = Bookmarks;

import Button from './components/Button';
global.Button = Button;

import Chart from './components/Chart';
global.Chart = Chart;

import Edit from './components/Edit';
global.Edit = Edit;

import EditPopup from './components/EditPopup';
global.EditPopup = EditPopup;

import FeatureTable from './components/FeatureTable';
global.FeatureTable = FeatureTable;

import Fullscreen from './components/Fullscreen';
global.Fullscreen = Fullscreen;

import Geocoding from './components/Geocoding';
global.Geocoding = Geocoding;

import GeocodingResults from './components/GeocodingResults';
global.GeocodingResults = GeocodingResults;

import Geolocation from './components/Geolocation';
global.Geolocation = Geolocation;

import Globe from './components/Globe';
global.Globe = Globe;

import HomeButton from './components/HomeButton';
global.HomeButton = HomeButton;

import ImageExport from './components/ImageExport';
global.ImageExport = ImageExport;

import InfoPopup from './components/InfoPopup';
global.InfoPopup = InfoPopup;

import LayerList from './components/LayerList';
global.LayerList = LayerList;

import LoadingPanel from './components/LoadingPanel';
global.LoadingPanel = LoadingPanel;

import Login from './components/Login';
global.Login = Login;

import MapConfig from './components/MapConfig';
global.MapConfig = MapConfig;


import MapConfigTransformService from './services/MapConfigTransformService';
global.MapConfigTransformService = MapConfigTransformService;

import MapConfigService from './services/MapConfigService';
global.MapConfigService = MapConfigService;

import MapPanel from './components/MapPanel';
global.MapPanel = MapPanel;

import Measure from './components/Measure';
global.Measure = Measure;

import Navigation from './components/Navigation';
global.Navigation = Navigation;

import Playback from './components/Playback';
global.Playback = Playback;

import QGISLegend from './components/QGISLegend';
global.QGISLegend = QGISLegend;

import QGISPrint from './components/QGISPrint';
global.QGISPrint = QGISPrint;

import QueryBuilder from './components/QueryBuilder';
global.QueryBuilder = QueryBuilder;

import Rotate from './components/Rotate';
global.Rotate = Rotate;

import Select from './components/Select';
global.Select = Select;

import ToolActions from './actions/ToolActions';
global.ToolActions = ToolActions;

import WFST from './components/WFST';
global.WFST = WFST;

import Zoom from './components/Zoom';
global.Zoom = Zoom;

import ZoomSlider from './components/ZoomSlider';
global.ZoomSlider = ZoomSlider;
