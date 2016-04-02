import fs from 'fs';

var USE_TAG_RAW = /<use\s*(component|behavior)="([-a-z\/\.]*)"(\s*as="([-a-z]*)")?\s*\/>\s*/ig,
    USE_TAG_STRING = /<use\s*(component|behavior)=\\"([-a-z\/\.]*)\\"(\s*as=\\"([-a-z]*)\\")?\s*\/>(\s|\\r|\\n)*/ig,
    STYLE_TAG_RAW = /<link\s(.*?)href="([-a-z\/\.]*)"[^>]*>\s*/ig,
    STYLE_TAG_STRING = /<link\s(.*?)href=\\"([-a-z\/\.]*)\\"[^>]*>(\s|\\r|\\n)*/ig;

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
    
    content = content.replace(useTag, (m, kind, path, _, as) => {
        if (!callback) {
            resolveSync.call(this, kind, path, as);
        } else {
            waiting++;
            kind === 'component' && waiting++;
            
            uses.push([kind, path, as]);
        }
        
        return '';
    });
    
    content = content.replace(styleTag, (m, _, path) => {
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
                as: as(item[2], path),
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
    
    function resolveSync(kind, path, as) {
        var desc = {
                as: as(as, path),
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
            desc.files.push(`'${desc.as}': require('${desc.path}')['default']`);
        }
        
        finish();
    }
    
    function as(as: string, path: string) {
        return (as || path.split('/').pop()).toUpperCase();
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
            
            components.push(`'${component.as}': {\n\t\t\t${component.files.join(',\n\t\t\t')}\n\t\t}`);
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

var Template = require('mahalo/mahalo')['Template'],
    components = {\n\t\t${components.join(',\n\t\t')}\n\t},
    behaviors = {\n\t\t${behaviors.join(',\n\t\t')}\n\t};		

exports.default = new Template(${content}, components, behaviors);`;
    }
};