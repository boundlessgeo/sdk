const path = require('path');

const Metalsmith = require('metalsmith');
const handlebars = require('handlebars');
const templates = require('metalsmith-layouts');
const marked = require('marked');

const srcDir = path.join(__dirname, '..', 'examples');
const destDir = path.join(__dirname, '..', 'build', 'examples');
const templatesDir = path.join(__dirname, '..', 'config', 'examples');

const isJsRegEx = /\.js$/;
const isCssRegEx = /\.css$/;

function createIndex(files, metalsmith, done) {
  setImmediate(done); // all remaining code is synchronous
  let index = '<!DOCTYPE html>';
  index += '<html>';
  index += '<head>';
  index += '<title>Boundless SDK Examples</title>';
  index += '<link rel="stylesheet" type="text/css" href="examples.css"/>';
  index += '</head>';
  index += '<body>';
  index += '<div id="header">';
  index += 'Boundless SDK Examples';
  index += '</div>';
  index += '<ul>';
  const keys = Object.keys(files);
  for (let i = 0, ii = keys.length; i < ii; ++i) {
    const filename = keys[i];
    const example = files[filename];
    if (filename.indexOf('index.html') !== -1 && filename.indexOf('.swp') === -1) {
      index += '<li>';
      index += `<a href="${filename}">${example.title}</a><br>`;
      index += `${example.shortdesc}`;
      index += '</li>';
    }
  }
  index += '</ul>';
  index += '</body>';
  index += '</html>';
  // eslint-disable-next-line no-param-reassign
  files['index.html'] = {
    contents: new Buffer(index),
    mode: '0644',
  };
}

function augmentExamples(files, metalsmith, done) {
  setImmediate(done); // all remaining code is synchronous
  const keys = Object.keys(files);
  for (let i = 0, ii = keys.length; i < ii; ++i) {
    const filename = keys[i];
    const file = files[filename];
    if (filename.indexOf('index.html') !== -1 && filename.indexOf('.swp') === -1) {
      if (!file.layout) {
        throw new Error(`${filename}: Missing "layout" in YAML front-matter`);
      }
      const id = filename.split(path.sep)[0];

      file.js = {
        tag: `<script src="./${id}.bundle.js"></script>`,
      };
      const cssFilename = `${id}/app.css`;
      if (cssFilename in files) {
        file.css = {
          tag: '<link rel="stylesheet" href="app.css">',
        };
      }

      // add additional resources
      if (file.resources) {
        const resources = [];
        for (let j = 0, jj = file.resources.length; j < jj; ++j) {
          const resource = file.resources[j];
          if (isJsRegEx.test(resource)) {
            resources[j] = `<script src="${resource}"></script>`;
          } else if (isCssRegEx.test(resource)) {
            resources[j] = `<link rel="stylesheet" href="${resource}">`;
          } else {
            throw new Error(`Invalid value for resource: ${resource} is not .js or .css: ${filename}`);
          }
        }
        file.extraHead = {
          local: resources.join('\n'),
        };
      }
    }
  }
}

function main(callback) {
  const smith = new Metalsmith('.')
      .source(srcDir)
      .destination(destDir)
      .concurrency(25)
      .use(augmentExamples)
      .use(createIndex)
      .use(templates({
        engine: 'handlebars',
        directory: templatesDir,
        helpers: {
          md(str) {
            return new handlebars.SafeString(marked(str));
          },
        },
      }))
      .build((err) => {
        callback(err);
      });
  return smith;
}

if (require.main === module) {
  main((err) => {
    if (err) {
      process.stderr.write(`Building examples failed.  See the full trace below.\n\n ${err.stack} \n`);
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}

module.exports = main;
