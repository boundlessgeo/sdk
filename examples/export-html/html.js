import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import saveAs from 'save-as';

/** Component to export map image to html.
 */
class HTMLExporter extends React.PureComponent {

  makeHeader(body_element) {
    const header = document.createElement('H1');
    body_element.appendChild(header);
    let map_name;
    if (this.props.title) {
      map_name = this.props.title;
    } else if (this.props.mapName === 'default') {
      map_name = 'Boundless Web SDK Map';
    } else {
      map_name = this.props.mapName;
    }
    const header_text = document.createTextNode(map_name);
    header.appendChild(header_text);
  };

  mapToImage(canvas_element, img_container, html_doc) {
    const url = canvas_element.toDataURL();
    const map_img = new Image(canvas_element.width/2, canvas_element.height/2);
    map_img.onload = () => {
      img_container.appendChild(map_img);
      const serialized = (new XMLSerializer()).serializeToString(html_doc);
      const blob = new Blob([serialized], {type: "text/html"});
      saveAs(blob, "map.html");
    };
    map_img.src = url;
  };

  makeFooter(body_element) {
    const footer = document.createElement('footer');
    body_element.appendChild(footer);
    let footer_content;
    if (this.props.footer) {
      footer_content = this.props.footer;
    } else {
      const date = new Date();
      footer_content = `Created on ${date.getMonth() + 1} / ${date.getDate()} / ${date.getFullYear()}`;
    }
    const footer_text = document.createTextNode(footer_content);
    footer.appendChild(footer_text);
  };

  toHTML() {
    // grab the canvas element from the app
    const canvas = document.getElementsByTagName('canvas')[0];

    // create a new document to export
    const doc = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
    // add a head to the document
    const head = document.createElement('head');
    doc.documentElement.appendChild(head);
    // add a body to the document
    const body = document.createElementNS('http://www.w3.org/1999/xhtml', 'body');
    body.style.fontFamily = 'Arial';
    doc.documentElement.appendChild(body);
    // add a title element and text to the head
    const title = document.createElement('title');
    head.appendChild(title);
    const title_text = document.createTextNode('Boundless Web SDK Map');
    title.appendChild(title_text);

    if (this.props.showTitle) {
      // add a header element and text to the body
      this.makeHeader(body);
    };

    // add a div element for the map image
    const img_div = document.createElement('div');
    img_div.style.overflow = 'scroll';
    body.appendChild(img_div);

    // add the map img
    this.mapToImage(canvas, img_div, doc);

    if (this.props.showFooter) {
      // add a footer element and created-on-date-text to the body
      this.makeFooter(body);
    };
  };

  render() {
    return (
      <button className="sdk-btn" onClick={ () => { this.toHTML(); }} variant="flat">
        Export Map Image As HTML
      </button>
    );
  };
};

HTMLExporter.propTypes = {
  showTitle: PropTypes.bool,
  title: PropTypes.string,
  showFooter: PropTypes.bool,
  footer: PropTypes.string,
};
HTMLExporter.defaultProps = {
  showTitle: true,
  title: '',
  showFooter: true,
  footer: '',
};

function mapStateToProps(state) {
  return {
    mapName: state.map.name,
  }
}

export default connect(mapStateToProps, null)(HTMLExporter);
