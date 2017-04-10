var mongodbQ = require('mongodb-queue');
var metrics = require('./sync-metrics');

/**
 * Make sure the real queue is created. Otherwise throws an error.
 */
function ensureQueueCreated(target) {
  if (!target.queue) {
    throw new Error('queue ' + target.queueName + ' is not created yet. Please call queue.create first');
  }
}

/**
 * construct a new queue that is backed by mongodb.
 * @param {String} name the name of the queue.
 * @param {Object} metrics an instance of fh-component-metrics client
 * @param {Object} opts configuration options for the queue
 * @param {Object} opts.mongodb an instance of the mongodb connection. This is required.
 * @param {Number} opts.visibility see https://github.com/chilts/mongodb-queue#visibility---message-visibility-window
 */
function MongodbQueue(name, metrics, opts) {
  if (!name) {
    throw new Error('name is required to create a mongodb queue');
  }
  if (!opts || !opts.mongodb) {
    throw new Error('mongodb is not specified to create mongodb queue');
  }
  this.queueName = name;
  this.metrics = metrics;
  this.mongodb = opts.mongodb;
  this.queueOptions = { visibility: opts.visibility || 30 };
  this.queue;
}

/**
 * @function MongodbQueue~createCallback
 * @param {Error} err An error occured when trying to create queue
 * @param {Object} queue The queue instance that is created
 */

/**
 * create the queue.
 * @param {MongodbQueue~createCallback} cb the callback function
 */
MongodbQueue.prototype.create = function(cb) {
  var self = this;
  if (!self.queue) {
    self.queue = mongodbQ(self.mongodb, self.queueName, self.queueOptions);
    self.queue.createIndexes(function(err){
      if (err) {
        return cb(err);
      }
      return cb(null, self.queue);
    });
  } else {
    return cb(null, self.queue);
  }
};

/**
 * See https://github.com/chilts/mongodb-queue for details about those methods.
 * We may not need all those methods, we can review them and remove the ones that we don't need.
 */
['add', 'get', 'ack', 'ping', 'total', 'size', 'inFlight', 'done', 'clean'].forEach(function(methodName){
  MongodbQueue.prototype[methodName] = function() {
    var self = this;
    ensureQueueCreated(self);
    var args = [].slice.call(arguments);
    var callback = args.pop();
    if (typeof callback !== 'function') {
      throw new Error("no callback function found for queue." + methodName);
    }
    var timer = metrics.startTimer();
    args.push(function(){
      var timing = timer.stop();
      self.metrics.gauge(metrics.KEYS.QUEUE_OPERATION_TIME, {method: methodName, name: self.queueName}, timing);
      return callback.apply(null, arguments);
    });
    self.queue[methodName].apply(self.queue, args);
  };
});

module.exports = MongodbQueue;