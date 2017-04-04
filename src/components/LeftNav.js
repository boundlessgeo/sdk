import React from 'react';
import Drawer from 'material-ui/Drawer';
import {MenuItem, Menu, Tabs, Popover, AppBar}from 'material-ui';
// import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import IconButton from 'material-ui/IconButton';

/**
 * Drawer to use for left nav, drawer uses dropdown list to control tabs
 *
 * ```xml
 * const tablist = [   <Tab key={1} value={1} label='Legend'><Legend map={map} /></Tab>,
 *                      <Tab key={2} value={2} label='FeatureTabe'><FeatureTable ref='table' map={map} /></Tab>,
 *                      <Tab key={3} value={3} label='WFST'><WFST ref='edit' toggleGroup='navigation' showEditForm={true} map={map} />]</Tab>
 *                  ];
 * <LeftNav tabList={tablist}  />
 * ```
 */
class LeftNav extends React.PureComponent {
    static propTypes = {
      /**
       * Override width of left nav
       */
      width: React.PropTypes.number,
      /**
       * Contents of the Drawer
       */
      children: React.PropTypes.node,
      /**
       * array of <tab> components to be added to <Tabs>
       */
      tabList: React.PropTypes.node,
      /**
       * NavItem components to be added to LeftNav
       */
      navitems: React.PropTypes.node,
      /**
       * If true drawer is opened
       */
      open: React.PropTypes.bool,
      /**
       *  Callback for closing the drawer
       */
      onRequestClose: React.PropTypes.func

    };
    constructor(props, context) {
      super(props);
    }
    componentWillMount() {
      if (this.props.tabList) {
        this.setState({
          menuText: this.props.tabList[0].props.label,
          selectedIndex: this.props.tabList[0].props.value,
          appBarIcon: this.props.tabList[0].props.icon,
          appBarOnTouch: this.props.tabList[0].props.onActive
        });
      }
    }
    static childContextTypes = {
      muiTheme: React.PropTypes.object.isRequired
    };
    state = {
      menuOpen: false
    };

    handleToggle = () => {
      this.setState({
        menuOpen: !this.state.open
      });
    };
    handleMenuTouchTap = (event) => {
      // This prevents ghost click.
      event.preventDefault();
      this.setState({
        menuOpen: true,
        anchorEl: event.currentTarget
      });
    };
    handleMenuRequestClose = () => {
      this.setState({
        menuOpen: false
      });
    };
    handleMenuChange = (event, value) => {
      this.setState({
        selectedIndex: value.props.value,
        menuOpen: false,
        menuText: value.props.primaryText,
        appBarIcon: this.rightIcon[value.props.value].icon,
        appBarOnTouch: this.rightIcon[value.props.value].onTouchTap
      });
    };
    close = (event, value) => {
      this.props.onRequestClose();
    }
    static defaultProps = {
      open: true,
      menuOpen: false,
      width: 360
    };
    rightIcon = {};
    render() {
      const iconStyles = {
        color: '#fff'
      };
      var tabs;
      var noDisplayStyle = {
        display: 'none'
      };
      var menuItems = [];
      var icons = {}
      if (this.props.tabList) {
        tabs = (<Tabs tabItemContainerStyle = { noDisplayStyle } inkBarStyle = { noDisplayStyle } value = { this.state.selectedIndex }>{this.props.tabList}</Tabs>);
        this.props.tabList.forEach((tab) => {
          if (tab.props.icon) {
            icons[tab.props.value] = {icon: tab.props.icon, onTouchTap: tab.props.onActive};
          }else {
            icons[tab.props.value] = {icon: <span/>, onTouchTap: null};
          }
          menuItems.push(<MenuItem primaryText = { tab.props.label } value = { tab.props.value }/>);
        });
      }
      this.rightIcon = icons;
      return (
        <Drawer width = { this.props.width } open = { this.props.open } >
          <AppBar title = { <span><span onTouchTap = { this.handleMenuTouchTap }> {this.state.menuText} <NavigationArrowDropDown style = { iconStyles }/></span>
            <Popover
              open = { this.state.menuOpen }
              anchorEl = { this.state.anchorEl }
              anchorOrigin = {{horizontal: 'left', vertical: 'bottom'}}
              targetOrigin = {{horizontal: 'left', vertical: 'top'}}
              onRequestClose = {this.handleMenuRequestClose} >
                  <Menu onItemTouchTap = { this.handleMenuChange } children={menuItems}/>
               </Popover></span>}
            iconElementLeft = { <IconButton> <NavigationArrowBack/> </IconButton>}
            onLeftIconButtonTouchTap={this.close}

            iconElementRight = {this.state.appBarIcon}
            onRightIconButtonTouchTap = {this.state.appBarOnTouch} />
          { tabs }
          { this.props.children }
        </Drawer>
      );
    }
}

export default LeftNav;
