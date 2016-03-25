import fs from 'fs';

export default function mahaloLoader(content) {
	var context = this.context,
		callback = this.async(),
		uses = [],
		components = [],
		attributes = [],
		waiting = 0;
	
	this.cacheable(true);
	
	content = content
		.replace(/\s+/g, ' ')
		.replace(/'/g, "\\'")
		.replace(/<use\s(component|attribute)="(.*?)"(\s?as="(.*?)")?\s?\/>\s?/ig, function(m, kind, path, _, as) {
			if (!callback) {
				checkFiles(kind, path, as, this.resolveSync(context, path));
			} else {
				waiting++;
				
				uses.push([kind, path, as]);
			}
			
			return '';
		}.bind(this));
	
	if (callback) {
		if (!waiting) {
			return finish() || '';
		}
		
		uses.forEach(resolveAsync, this);
	} else {
		return render();
	}
	
	function resolveAsync(item) {
		var kind = item[0],
			path = item[1],
			as = item[2];
		
		this.resolve(context, path, function(err, use) {
			if (err) {
				return callback(err);
			}
			
			checkFiles(kind, path, as, use);
			
			--waiting || finish();
		});
	}
		
	function checkFiles(kind, path, as, use) {
		var desc = [];
		
		if (kind === 'component') {
			if (fs.existsSync(use)) {
				desc.push(`Component: require('${path}')['default']`);
			}
			
			if (fs.existsSync(use.replace(/(ts|js)$/, 'html'))) {
				desc.push(`template: require('${path}.html')['default']`);
			}
			
			if (desc.length) {
				as = as || path.split('/').pop();
				components.push(`'${as.toUpperCase()}': {${desc.join(', ')}}`);
			}
		} else if (fs.existsSync(use)) {
			as = as || path.split('/').pop();
			attributes.push(`'${as}': require('${path}')['default']`);
		}
	}
	
	function finish() {
		callback(null, render());
	}

	function render() {
		return `"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
	
var Template = require('mahalo/mahalo')['Template'],
	components = {${components.join(', ')}},
	attributes = {${attributes.join(', ')}};		

exports.default = new Template('${content}', components, attributes);`;
	}
};