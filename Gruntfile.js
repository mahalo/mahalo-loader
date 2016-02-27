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

    grunt.registerTask('default', ['babel']);
};