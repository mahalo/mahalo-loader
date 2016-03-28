import {minify} from 'html-minifier';

var config = {
		keepClosingSlash: true,
		collapseWhitespace:	true,
		conservativeCollapse: true
	};

export default function mahaloLoader(content) {
	var context = this.context,
		callback = this.async(),
		uses = [],
		_components = [],
		_behaviors = [],
		waiting = 0;
	
	this.cacheable(true);
	
	content = minify(content, config).replace(/<use\s(component|behavior)="(.*?)"(\s?as="(.*?)")?\s?\/>\s?/ig, (m, kind, path, _, as) => {
		if (!callback) {
			resolveSync.call(this, kind, path, as);
		} else {
			waiting++;
			kind === 'component' && waiting++;
			
			uses.push([kind, path, as]);
		}
		
		return '';
	});
	
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
			
			components.push(`'${component.as}': {\n\t\t${component.files.join(', ')}\n\t}`);
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

var Template = require('mahalo/mahalo')['Template'],
	components = {\n\t${components.join(',\n\t')}\n},
	behaviors = {${behaviors.join(', ')}};		

exports.default = new Template(${JSON.stringify(content)}, components, behaviors);`;
	}
};