var http = require('http'),
  https = require('https'),
  util = require('util'),
  assert = require('assert'),
  futils = require('./fhutils'),
  fhforms = require('fh-forms'),
  logger,
  appname,
  config,
  fhutils

// $fh.forms... cloud api
var checkDomainDatabase = function(cb){
  var domainDbUri = process.env.FH_DOMAIN_DATABASE;
  if(domainDbUri){
    return cb(undefined, domainDbUri);
  } else {
    return cb(new Error("No domain database specified"));
  }
}

//Requires appId to be specified -- appId === FH_WIDGET
//Full dynofarm app name === FH_APPNAME
//Env === FH_ENV
var getForms = function(options, cb){

  checkDomainDatabase(function(err, domainDbUri){
    if(err) return cb(err);
    options.uri = domainDbUri;

    options.appId = config.fhapi.widget; //AppId should never be set by anything but FH_WIDGET -- override anything that has already set it.
    fhforms.getForms(options, cb);
  });
};

var getForm = function(options, cb){

  checkDomainDatabase(function(err, domainDbUri){
    if(err) return cb(err);
    options.uri = domainDbUri;

    options.appId = config.fhapi.widget; //AppId should never be set by anything but FH_WIDGET -- override anything that has already set it.

    fhforms.getForm(options, cb);
  });
};

//Requires appId
var getTheme = function(options, cb){

  checkDomainDatabase(function(err, domainDbUri){
    if(err) return cb(err);
    options.uri = domainDbUri;
    options.appId = config.fhapi.widget; //AppId should never be set by anything but FH_WIDGET -- override anything that has already set it.
    fhforms.getTheme(options, cb);
  });
};

//Requires appId
var getAppClientConfig = function(options, cb){

  checkDomainDatabase(function(err, domainDbUri){
    if(err) return cb(err);
    options.uri = domainDbUri;
    options.appId = config.fhapi.widget; //AppId should never be set by anything but FH_WIDGET -- override anything that has already set it.
    fhforms.getAppClientConfig(options, cb);
  });
};

var submitFormData = function(options, cb){

  checkDomainDatabase(function(err, domainDbUri){
    if(err) return cb(err);
    options.uri = domainDbUri;

    if(options.submission === undefined){
      options.submission = {};
    }

    options.submission.appId = config.fhapi.widget; //AppId should never be set by anything but FH_WIDGET -- override anything that has already set it.
    options.submission.appClientId = options.appClientId;
    options.submission.appCloudName = config.fhapi.appname;
    options.submission.appEnvironment = process.env.FH_ENV || "NOT-SET";

    fhforms.submitFormData(options, cb);
  });
};

var submitFormFile = function(options, cb){

  checkDomainDatabase(function(err, domainDbUri){
    if(err) return cb(err);
    options.uri = domainDbUri;
    fhforms.submitFormFile(options, cb);
  });
};

var getSubmissionStatus = function(options, cb){

  checkDomainDatabase(function(err, domainDbUri){
    if(err) return cb(err);
    options.uri = domainDbUri;
    fhforms.getSubmissionStatus(options, cb);
  });
};

var completeSubmission = function(options, cb){

  checkDomainDatabase(function(err, domainDbUri){
    if(err) return cb(err);
    options.uri = domainDbUri;
    fhforms.completeFormSubmission(options, cb);
  });
};

var forms = {
  "getForms" : getForms,
  "getForm" : getForm,
  "getTheme" : getTheme,
  "getAppClientConfig": getAppClientConfig,
  "submitFormData" : submitFormData,
  "submitFormFile" : submitFormFile,
  "getSubmissionStatus" : getSubmissionStatus,
  "completeSubmission" : completeSubmission
};

module.exports = function(cfg){
  assert.ok(cfg, 'cfg is undefined');
  config = cfg;
  logger = cfg.logger;
  appname = cfg.fhapi.appname;
  fhutils = new futils(config);
  return forms;
};



