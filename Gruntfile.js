module.exports = function(grunt) {
	"use strict";

	// Project configuration.
	grunt.initConfig({
		uglify: {
			target: {
				options: {
					preserveComments: 'some'
				},
				files: {
					'respond.min.js': ['respond.src.js']
				}
			}
		},
		jshint: {
			files: ['respond.src.js'],
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: false,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				smarttabs: true,
				node: true,
				es5: true,
				strict: false
			},
			globals: {
				Image: true,
				window: true
			}
		}
	});

	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );

	// Default task.
	grunt.registerTask('default', ['jshint', 'uglify:target']);

};
