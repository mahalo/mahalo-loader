const fs = require('fs');

module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	
    grunt.initConfig({
        babel: {
            dist: {
                files: {
                    'index.js': 'index.ts'
                }
            }
        }
    });
	
	grunt.registerTask('appendix', function() {
		fs.writeFileSync('index.js', fs.readFileSync('index.js') + '\nmodule.exports = exports.default;\n')
	});

    grunt.registerTask('default', ['babel:dist', 'appendix']);
};