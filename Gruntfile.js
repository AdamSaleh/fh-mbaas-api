var _ = require('underscore');

module.exports = function(grunt) {
  'use strict';

  function makeTestArgs(testFile) {
    return ['--setUp ./test/setup.js --tearDown ./test/setup.js', testFile].join(' ');
  };

  function makeUnits(testArgString) {
    return [test_runner, testArgString].join(' ');
  };

  function makeUnitCovers(testArgString) {
    return ['istanbul cover --dir cov-unit', test_runner, '--', testArgString].join(' ');
  };

  var tests = [
    './test/test_fhact.js',
    /*'./test/test_fhdb.js',*/
    './test/test_fhfeed.js',
    './test/test_fhforms.js',
    './test/test_fhsec.js',
    './test/test_fhsession.js',
    './test/test_fhstat.js',
    './test/test_redis.js',
    './test/test_sync.js',
    /*'./test/test_web.js',*/
    './test/test_fhauth.js'
  ];
  var unit_args = _.map(tests, makeTestArgs);
  var test_runner = 'turbo';

  // Just set shell commands for running different types of tests
  grunt.initConfig({

    // These are the properties that grunt-fh-build will use

    unit: _.map(unit_args, makeUnits),
    unit_cover: _.map(unit_args, makeUnitCovers)
  });

  grunt.loadNpmTasks('grunt-fh-build');
  grunt.registerTask('default', ['fh:default']);
};
