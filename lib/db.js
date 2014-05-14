var http = require('http'),
https = require('https'),
request = require('request'),
hyperquest = require('hyperquest'),
fs = require('fs'),
util = require('util'),
assert = require('assert'),
futils = require('./fhutils'),
logger,
appname,
config,
ditch_host,
fhutils,
ditch_port;

module.exports = function(cfg){
  assert.ok(cfg, 'cfg is undefined');
  config = cfg;
  logger = cfg.logger;
  appname = cfg.fhapi.appname;
  fhutils = new futils(config);
  // Ditch settings
  if (cfg && cfg.fhditch) {
    if (cfg.fhditch.host) ditch_host = cfg.fhditch.host;
    if (cfg.fhditch.port) ditch_port = cfg.fhditch.port;
  }
  return db;
};

// $fh.db
var db = function(params, callback) {
  if (params.act == undefined) throw new Error("'act' undefined in params. See documentation of $fh.db for proper usage");
  // Type required for all but list operations, where we can list collections by omitting the type param
  if (params.type == undefined && ['close', 'list', 'export', 'import'].indexOf(params.act)===-1) throw new Error("'type' undefined in params. See documentation of $fh.db for proper usage");
  if (appname == undefined) throw new Error("Internal error - no appId defined");



  params.__fhdb = appname;
  //If there is a mongo connection url, then the one-db-per-app parameter must be set for the request
  //to alert ditcher the app has its own database.
  if(process.env.FH_MONGODB_CONN_URL){
    params.__dbperapp = appname;
  }
  var fhdb = require('fh-db');
  if(process.env.FH_USE_LOCAL_DB || process.env.FH_MONGODB_CONN_URL) {
    return fhdb.local_db(params, callback);
  }
  else {
    //net_db should not be called by apps created using fh-webapp --
    if(process.env.FH_DB_PERAPP){
      return callback(new Error("Data storage not enabled for this app. Please use the Data Browser window to enable data storage."));
    }else{
      return net_db(params, callback);
    }
  }
};

function net_db(params, callback) {
  var headers = { "accept" : "application/json" },
  url = config.fhditch.protocol + "://" + ditch_host + ":" + ditch_port + '/data/' + params.act,
  postData = {
    uri : url,
    headers : headers,
    timeout : config.socketTimeout
  },
  req;
  headers["content-type"] = "application/json";
  fhutils.addAppApiKeyHeader(headers);
  if (!params.files){
    // Otherwise, these get sent as form data
    postData.json = params;
  }

  // Returning a zip file - stream this through as a file download..
  if (params.act === 'export'){
    headers['content-type'] = "application/zip";
    headers['content-disposition'] = "attachment; filename=collections.zip";
    req = hyperquest(url, { method : 'POST', headers : headers }, function(err, res){
      if (err){
        logger.warning('Problem contacting DITCH server: ' + err.message + "\n" + util.inspect(err.stack));
        return callback(err);
      }
      console.log(res);
    });
    req.write(params);
    req.end();
    return callback(null, { stream : req });
  }

  // All other requests come thru express.. TODO: Maybe we can stream these too?
  req = request.post(postData, function(err, res, body){
    if (err){
      logger.warning('Problem contacting DITCH server: ' + err.message + "\n" + util.inspect(err.stack));
      return callback(err);
    }
    if (res.headers['content-type'] && res.headers['content-type'].indexOf('application/zip')>-1){
      body = new Buffer(body, 'binary');
    }
    return callback(null, body);
  });

  if (params.files){
    var form = req.form();
    Object.keys(params.files).forEach(function(filekey){
      var file = params.files[filekey];
      form.append(filekey, fs.createReadStream(file.path));
    });
    // Append all strings as form data
    Object.keys(params).forEach(function(paramkey){
      var paramData = params[paramkey];
      if (typeof paramData === 'string'){
        form.append(paramkey, paramData);
      }
    });
  }

}
