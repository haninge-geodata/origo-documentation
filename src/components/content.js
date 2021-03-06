import React from 'react';
import Section from './section';
import PureRenderMixin from 'react-pure-render/mixin';
import GithubSlugger from 'github-slugger';
import { transformURL } from '../../custom';
let slugger = new GithubSlugger();
let slug = title => { slugger.reset(); return slugger.slug(title); };

function chunkifyAST(ast, language) {
  var preview = false;
  return ast.children.reduce((chunks, node) => {
    if (node.type === 'heading' && node.depth === 1) {
      return chunks;
    } else if (node.type === 'heading' && node.depth < 4) {
      chunks.push([node]);
    } else {
      chunks[chunks.length - 1].push(node);
    }
    return chunks;
  }, [[]]).filter(chunk => chunk.length)
  .map(chunk => {
    var left = [], right = [], title;
    if (language === 'cli') {
      language = 'bash';
    }
    if (chunk[0].depth < 3) {
      preview = false;
    }
    chunk.forEach(node => {
      if (node.type === 'code') {
        if (node.lang === 'json' || node.lang === 'http' || node.lang === 'html') {
          right.push(node);
        } else if (node.lang === language) {
          if (language === 'curl') {
            right.push({ ...node, lang: 'bash'  });
          } else {
            right.push(node);
          }
        } else if (node.lang === 'endpoint') {
          right.push(transformURL(node.value));
        } else if (node.lang === null) {
          left.push(node);
        }
      } else if (node.type === 'heading' && node.depth >= 4) {
        right.push(node);
      } else if (node.type === 'blockquote') {
        right.push(node);
      } else if (node.type === 'heading' && node.depth < 4 && !title) {
        title = node.children[0].value;
        left.push(node);
      } else if (node.type === 'html') {
        if (node.value.indexOf('<!--') === 0) {
          var content = node.value
            .replace(/^<!--/, '')
            .replace(/-->$/, '')
            .trim();
          if (content === 'preview') {
            preview = true;
          }
        }
      } else {
        left.push(node);
      }
    });
    return { left, right, title, preview, slug: slug(title) };
  });
}

var Content = React.createClass({
  mixins: [PureRenderMixin],
  propTypes: {
    ast: React.PropTypes.object.isRequired,
    language: React.PropTypes.string.isRequired,
    leftClassname: React.PropTypes.string.isRequired,
    rightClassname: React.PropTypes.string.isRequired
  },
  render() {
    let { ast, language, leftClassname, rightClassname } = this.props;
    return (<div className='clearfix'>
      {chunkifyAST(ast, language).map((chunk, i) => <Section
        leftClassname={leftClassname}
        rightClassname={rightClassname}
        chunk={chunk}
        key={i} />)}
    </div>);
  }
});

module.exports = Content;
