import fs from 'fs';

var USE_TAG_RAW = /<use\s*(component|behavior)="(~?[\w\/.-]+)"(\s*on="([^"]+)")?\s*\/>\s*/ig,
    USE_TAG_STRING = /<use\s*(component|behavior)=\\"(~?[\w\/.-]+)\\"(\s*on=\\"([^"]+)\\")?\s*\/>(\s|\\r|\\n)*/ig,
    STYLE_TAG_RAW = /<link\s(.*?)href="([\w\/\.\-]*)"[^>]*>\s*/ig,
    STYLE_TAG_STRING = /<link\s(.*?)href=\\"([\w\/\.\-]*)\\"[^>]*>(\s|\\r|\\n)*/ig,
    VALID_SELECTOR = /^((\.-?)?[\w][\w-]*|\[[^\s"'>\/=]+([*^]?=(["'])[^\4]*\4)?](?![\w]))+$/,
    VALID_ATTRIBUTE = /^[^\s"'>\/=]+$/;

export default function mahaloLoader(content) {
    var map = this.resourcePath + '.ts',
        context = this.context,
        callback = this.async(),
        uses = [],
        _components = [],
        _behaviors = [],
        styles = [],
        waiting = 0,
        useTag = USE_TAG_RAW,
        styleTag = STYLE_TAG_RAW;
    
    fs.existsSync(map) || fs.writeFile(map, 'var Template: Template;export default Template;');
    
    if (this.loaderIndex !== this.loaders.length - 1) {
        useTag = USE_TAG_STRING;
        styleTag = STYLE_TAG_STRING;
    }
    
    content = content.replace(useTag, (m, kind, path, _, on) => {
        if (!callback) {
            resolveSync.call(this, kind, path, on);
        } else {
            waiting++;
            kind === 'component' && waiting++;
            
            uses.push([kind, path, on]);
        }
        
        return '';
    });
    
    content = content.replace(styleTag, (m, _, path) => {
        path = ['.', '/'].indexOf(path[0]) < 0 ? './' + path : path;
        
        styles.push('require("' + path + '")');
        
        return '';
    });
    
    if (useTag === USE_TAG_RAW) {
        content = JSON.stringify(content);
    } else {
        content = content.replace(/\s*module\.exports\s*=\s*(.*)\s*;\s*$/, '$1');
    }
    
    if (!callback) {
        return render();
    }
    
    return (uses.length ? uses.forEach(resolveAsync, this) : finish()) || '';
    
    function resolveAsync(item) {
        var path = item[1],
            desc = {
                on: getOn.call(this, item[2], path, item[0]),
                path: path,
                files: []
            };
        
        if (item[0] === 'component') {
            _components.push(desc);		
            
            this.resolve(context, path, addComponent.bind(null, desc));
            this.resolve(context, path + '.html', addTemplate.bind(null, desc));
        } else {
            _behaviors.push(desc);
            
            this.resolve(context, path, addBehavior.bind(this, desc));
        }
    }
    
    function resolveSync(kind, path, on) {
        var desc = {
                on: getOn.call(this, on, path, kind),
                path: path,
                files: []
            };
        
        if (kind === 'component') {
            _components.push(desc);		
            
            this.resolveSync(context, path) && addComponent(desc);
            this.resolveSync(context, path + '.html') && addTemplate(desc);
        } else {
            _behaviors.push(desc);
            
            this.resolveSync(context, path) && addBehavior(desc);
        }
    }
    
    function addComponent(desc, err?) {
        if (!err) {
            desc.files.push(`Component: require('${desc.path}')['default']`);
        }
        
        finish();
    }
    
    function addTemplate(desc, err?) {
        if (!err) {
            desc.files.push(`template: require('${desc.path}.html')['default']`);
        }
        
        finish();
    }
    
    function addBehavior(desc, err?) {
        if (!err) {
            desc.files.push(`'${desc.on}': require('${desc.path}')['default']`);
        }
        
        finish();
    }
    
    function getOn(on: string, path: string, kind: string) {
        if (!on) {
            on = path.split('/').pop().replace(/[^\w]/g, '-').replace(/^-/, '');
        }

        if (kind === 'component') {
            VALID_SELECTOR.test(on) || this.emitError('Invalid selector for component');
        } else {
            VALID_ATTRIBUTE.test(on) || this.emitError('Invalid attribute name for behavior.');
        }

        return on.toUpperCase();
    }
    
    function finish() {
        if (--waiting > 0) {
            return;
        }
        
        callback && callback(null, render());
    }

    function render() {
        var components = [],
            behaviors = [];
        
        _components.forEach(component => {
            if (!component.files.length) {
                return;
            }
            
            components.push(`'${component.on}': {\n\t\t\t${component.files.join(',\n\t\t\t')}\n\t\t}`);
        });
        
        _behaviors.forEach(behavior => {
            if (!behavior.files.length) {
                return;
            }
            
            behaviors.push(behavior.files[0]);
        });
        
        return `"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

${styles.join(';\n')};

var Template = require('mahalo')['Template'],
    components = {\n\t\t${components.join(',\n\t\t')}\n\t},
    behaviors = {\n\t\t${behaviors.join(',\n\t\t')}\n\t};		

exports.default = new Template(${content}, components, behaviors);`;
    }
};