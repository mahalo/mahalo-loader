'use strict';

var fs = require('fs');

module.exports = function (content) {
	this.cacheable();

	var resolve = this.resolve.bind(this),
	    context = this.context,
	    callback = this.async(),
	    components = [],
	    attributes = [],
	    waiting = 0;

	content = content.replace(/\s+/g, ' ').replace(/'/g, "\\'").replace(/<use\s+(component|attribute)="(.*?)"\s*(as="(.*?)"\s*)?\/>\s*/ig, function (m, kind, path, _, as) {
		waiting++;

		resolve(context, path, function (err, use) {
			if (err) {
				return callback(err);
			}

			var desc = [];

			if (kind === 'component') {
				if (fs.existsSync(use)) {
					desc.push('Component: require(\'' + path + '\')[\'default\']');
				}

				if (fs.existsSync(use.replace(/js$/, 'html'))) {
					desc.push('template: require(\'' + path + '.html\')[\'default\']');
				}

				if (desc.length) {
					as = as || path.split('/').pop();
					components.push('\'' + as.toUpperCase() + '\': {' + desc.join(', ') + '}');
				}
			} else if (fs.existsSync(use)) {
				as = as || path.split('/').pop();
				attributes.push('\'' + as + '\': require(\'' + path + '\')[\'default\']');
			}

			if (! --waiting) {
				finish();
			}
		});

		return '';
	});

	function finish() {
		callback(null, '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n\tvalue: true\n});\n\t\nvar Template = require(\'access-core/app/template\')[\'default\'],\n\tcomponents = {' + components.join(', ') + '},\n\tattributes = {' + attributes.join(', ') + '};\t\t\n\nexports.default = new Template(\'' + content + '\', components, attributes);');
	}
};
