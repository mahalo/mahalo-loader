module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    
    grunt.initConfig({
        babel: {
            dist: {
                files: {
                    'lib/index.js': 'src/index.js'
                }
            }
        }
    });

    grunt.registerTask('default', ['babel']);
};