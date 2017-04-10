var util = require('util');
var syncUtil = require('./util');
var metrics = require('./sync-metrics');

var mongoClient;

/**
 * The acknowledgement object
 * @typedef {Object} storage~Acknowledgement
 * @property {String} type - if this updates has been applied successfully. Possible values: applied, failed and collisions.
 * @property {String} cuid - the unique client id that submitted that update
 * @property {String} action - the operation that the update is trying to perform. Possible values: create/update/delete
 * @property {String} hash - the hash value (can be considered as the unique id) of the update
 * @property {String} uid - the uid of the record the update is for
 * @property {String} msg - any message about the update. could be the error message if the update is failed
 * @property {Number} timestamp - when the update is applied
 */

/**
 * Find the delete the given sync update object from the `fhsync-<datasetId>-updates` collection
 * @param {String} datasetId
 * @param {storage~Acknowledgement} acknowledgement should at least have the `cuid` and `hash` fields
 * @param {Function} callback
 */
function doFindAndDeleteUpdate(datasetId, acknowledgement, callback) {
  syncUtil.doLog(datasetId, 'debug', 'doFindAndDeleteUpdate acknowledgement = ' + util.inspect(acknowledgement));
  var updatesCollection = mongoClient.collection(getDatasetUpdatesCollectionName(datasetId));
  updatesCollection.findOneAndDelete({cuid: acknowledgement.cuid, hash: acknowledgement.hash}, function(err, result) {
    if (err) {
      syncUtil.doLog(datasetId, 'error', ' Failed to doFindAndDeleteUpdate due to error ' + util.inspect(err) + ' :: acknowledgement = ' + util.inspect(acknowledgement));
      return callback(err);
    }
    return callback(null, result.value);
  });
}

/**
 * Save the sync update to the `fhsync-<datasetId>-updates` collection
 *
 * @param {String} datasetId
 * @param {storage~Acknowledgement} acknowledgementFields
 * @param {Function} callback
 */
function doSaveUpdate(datasetId, acknowledgementFields, callback) {
  syncUtil.doLog(datasetId, 'debug', 'doSaveUpdate acknowledgementFields = ' + util.inspect(acknowledgementFields));
  var updatesCollection = mongoClient.collection(getDatasetUpdatesCollectionName(datasetId));
  updatesCollection.findOneAndUpdate({cuid: acknowledgementFields.cuid, hash: acknowledgementFields.hash}, {'$set': acknowledgementFields}, {upsert: true, returnOriginal: false}, function(err, updateResult) {
    if (err) {
      syncUtil.doLog(datasetId, 'error', ' Failed to doSaveUpdate due to error ' + util.inspect(err) + ' :: acknowledgementFields = ' + util.inspect(acknowledgementFields));
      return callback(err);
    }
    return callback(null, updateResult.value);
  });
}

/**
 * List all the updates that match the given search criteria
 *
 * @param {String} datasetId
 * @param {Object} criteria
 * @param {Function} callback
 */
function doListUpdates(datasetId, criteria, callback) {
  syncUtil.doLog(datasetId, 'debug', 'doListUpdates datasetId = ' + datasetId + ' :: criteria = ' + util.inspect(criteria));
  var updatesCollection = mongoClient.collection(getDatasetUpdatesCollectionName(datasetId));
  updatesCollection.find(criteria).toArray(function(err, updates) {
    if (err) {
      syncUtil.doLog(datasetId, 'error', ' Failed to doListUpdates due to error ' + util.inspect(err) + ' :: datasetId = ' + datasetId +  ' :: criteria = ' + criteria);
      return callback(err);
    }
    return callback(null, updates);
  });
}

module.exports = function(mongoClientImpl) {
  mongoClient = mongoClientImpl;
  return {
    /**
     * find the delete the given sync update
     * @param {String} datasetId
     * @param {storage~Acknowledgement} acknowledgement
     * @param {Function} callback
     */
    findAndDeleteUpdate: function(datasetId, acknowledgement, callback) {
      return metrics.timeAsyncFunc(metrics.KEYS.MONGODB_OPERATION_TIME, doFindAndDeleteUpdate)(datasetId, acknowledgement, callback);
    },

    /**
     * Save the given sync update
     * @param {String} datasetId
     * @param {storage~Acknowledgement} acknowledgementFields
     * @param {Function} callback
     */
    saveUpdate: function(datasetId, acknowledgementFields, callback) {
      return metrics.timeAsyncFunc(metrics.KEYS.MONGODB_OPERATION_TIME, doSaveUpdate)(datasetId, acknowledgementFields, callback);
    },

    /**
     * List the updates that match the given list criteria
     * @param {String} datasetId
     * @param {Object} criteria the list criteria, a mongodb query object
     * @param {Function} callback
     */
    listUpdates: function(datasetId, criteria, callback) {
      return metrics.timeAsyncFunc(metrics.KEYS.MONGODB_OPERATION_TIME, doListUpdates)(datasetId, criteria, callback);
    }
  };
};


/**
 * Get the collection name of the updates team
 * @param {String} datasetId
 * @returns the name of the updates collection
 */
function getDatasetUpdatesCollectionName(datasetId) {
  return ['fhsync', datasetId, 'updates'].join('_');
}

module.exports.getDatasetUpdatesCollectionName = getDatasetUpdatesCollectionName;