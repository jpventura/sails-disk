const _ = require('lodash');
const admin = require('firebase-admin');
const Aggregate = require('./aggregates');
const async = require('async');
const WaterlineErrors = require('waterline-errors');
const fsx = require('fs-extra');
const Promise = require('bluebird');
const util = require('util');
const WaterlineCriteria = require('waterline-criteria');

const create = require('./create');

/**
 * A File-Backed Datastore
 *
 * @param {Object} config
 * @param {Object} collections
 * @return {Object}
 * @api public
 */

var Application = function(config, collections) {
  var self = this;

  // Hold configuration values for each collection, this allows each
  // collection to define which file the data is synced to
  this.config = config || {};

  // Build a filePath
  // FIXME: Remove on final version
  this.filePath = this.config.filePath + (this.config.fileName || (this.config.identity + '.db'));

  // Hold Collections
  this.collections = collections || {};

  // Build an object to hold the data
  this.data = {};

  // Build a Counters Object for Auto-Increment
  this.counters = {};

  // Hold Schema Objects to describe the structure of an object
  self.schemas = {};

  return this;
};


/**
 * Initialize Database
 *
 */

Application.prototype.initializeApplication = function(cb) {
  var self = this;

  const config = _.cloneDeep(self.config);

  try {
    self.admin = admin.app(config.identity);
  } catch (error) {
    config.credential = this._buildCredential(config);
    self.admin = admin.initializeApp(config, config.identity);
  }

  try {
    self.application = self._initializeApplication(self.config);
    self.database = self.application.database();
    self.identity = self.config.identity;

    self.database.ref('schemas')
      .once('value')
      .then(function(snapshot) {
        if (snapshot.exists()) {
          self.schemas = _.extend(self.schemas, snapshot.val());
        }
      })
      .catch(function(error) {
        return cb(error);
      });
  } catch (error) {
    return cb(error);
  }

  async.auto({

    checkData: function(done) {
      if(Object.keys(self.data).length > 0) return done();
      self.read(done);
    },

    setCollection: ['checkData', function (resultsSoFar, done) {
      try {
        // this.application = self._initializeApplication(this.config);
        // this.database = this.application.database();
        // this.identity = this.config.identity;

        async.eachSeries(Object.keys(self.collections), function (key, next) {
          try {
            var collection = self.collections[key];
            self.registerCollection(key, collection, next);
          } catch (e) { return next(e); }
        }, done);
      } catch (e){ return done(e); }
    }]

  }, cb);

};

/**
 * Build Firebase application with/without admin privileges
 *
 * @api private
 */
Application.prototype._initializeApplication = function(config) {
  try {
    return admin.app(config.identity);
  } catch (error) {
    config.credential = this._buildCredential(config);
    return admin.initializeApp(config, config.identity);
  }
};

/**
 * Build Firebase credential
 *
 * @param {Function} cb
 * @api private
 */
Application.prototype._buildCredential = function(config) {

  if (config.credential) {
    return admin.credential.cert(config.credential);
  }

  return admin.credential.applicationDefault();
};

/**
 * Register Collection
 *
 * @param {String} collectionName
 * @param {Object} collection
 * @param {Function} callback
 * @api public
 */

Application.prototype.registerCollection = function(collectionName, collection, cb) {
  var self = this;

  const onResolve = function() {
    return self.setCollection(collectionName, collection, cb);
  };

  const onReject = function(error) {
    return cb(error);
  };

  return Promise.all([
    this.database.ref('counts').child(collectionName).set(0),
    this.database.ref('schemas').child(collectionName).set(collection.definition)
  ])
  .then(onResolve, onReject);
};

/**
 * Set Collection
 *
 * @param {String} collectionName
 * @param {Object} definition
 * @return Object
 * @api private
 */

Application.prototype.setCollection = function(collectionName, options, cb) {
  var self = this;

  // console.log(collectionName);
  // console.log(' ');
  // console.log(' ');
  // console.log(' ');
  // console.log(' ');
  // console.log(' ');
  // console.log(' ');
  // console.log(options);
  // console.log(' ');
  // console.log(' ');
  // console.log(' ');
  // console.log(' ');
  // console.log(' ');
  // console.log(' ');
  // If no filePath is set for this collection, return an error in the object
  // FIXME: Remove on final version
  if(!this.filePath) return cb(new Error('No filePath was configured for this collection'));

  // Set Defaults
  var data = this.data[collectionName] || [];
  data.concat(options.data || []);

  // Ensure data is set
  this.data[collectionName] = data || [];

  // Set counters
  var counters = this.counters[collectionName] = this.counters[collectionName] || {};

  if(options.definition) options.definition = _.cloneDeep(options.definition);
  var schemas = this.schemas[collectionName] = options.definition || {};

  var obj = {
    data: data,
    schemas: schemas,
    counters: counters
  };

  var onResolve = function() {
    cb(null, obj);
  };

  var onReject = function(error) {
    return cb(error);
  };

  return Promise.all([
    self.database.ref('counts').child(collectionName).set(Object.keys(data).length),
    self.database.ref('data').child(collectionName).update(data)
  ]).then(onResolve, onReject);

};

/**
 * Write Data To Disk
 *
 * @param {String} collectionName
 * @param {Function} callback
 * @api private
 */

Application.prototype.write = function(collectionName, cb) {
  var self = this;

  // FIXME: Remove on final version
  if(!this.filePath) return cb(new Error('No filePath was configured for this collection'));

  var data = this.data;
  var schemas = this.schemas;
  var counters = this.counters;


  const porra = { data: data, schemas: schemas, counters: counters };
  const caralho = _.cloneDeep(porra);

  // FIXME: Remove on final version
  fsx.createFileSync(this.filePath);
  fsx.outputJsonSync(self.filePath, porra);

  var xxx = {};

  if (self.data[collectionName]) {
    self.data[collectionName].forEach(function (item) {
      xxx[item.id] = item;
    });
  }

  caralho.data = xxx;

  const onResolve = function () {
    return cb();
  };

  const onReject = function (error) {
    console.log(error);
    return cb(error);
  };

  // var promises = [];
  // for (var i = 0; i < this.data.length; i++) {
  //   const promise = self.database.ref('data')
  //     .child(collectionName)
  //     .child(this.data[i].id)
  //     .set(this.data[i]);
  //
  //   console.log(this.data[i]);
  //   promises.push(promise);
  // }
  //
  // return Promise.all(promises).then(onResolve, onReject);

  if (!this.data[collectionName]) {
    return Promise.all([
      self.database.ref('data').child(collectionName).set(xxx),
      self.database.ref('schemas').child(collectionName).set(null)
    ]).then(onResolve, onReject);
  } else {
    return Promise.all([
      self.database.ref('data').child(collectionName).set(xxx)
    ]).then(onResolve, onReject);
  }
};

/**
 * Read Data From Disk
 *
 * @param {Function} callback
 * @api private
 */

Application.prototype.read = function(cb) {
  var self = this;

  // FIXME: Remove on final version
  if(!this.filePath) return cb(new Error('No filePath was configured for this collection'));

  // FIXME: Remove on final version
  var exists = fsx.existsSync(this.filePath);

  // FIXME: Remove on final version
  if(!exists) {
    fsx.createFileSync(this.filePath);
    return cb(null, { data: {}, schemas: {}, counters: {} });
  }

  // Check if we have already read the data file into memory
  if(Object.keys(self.data).length !== 0) return cb(null, {
    data: self.data,
    schemas: self.schemas,
    counters: self.counters
  });

  // FIXME: Remove on final version
  var data = fsx.readFileSync(this.filePath, { encoding: 'utf8' });

  if(!data) return cb(null, { data: {}, schemas: {}, counters: {} });

  var state;

  try {
    state = JSON.parse(data);
  }
  catch (e) {
    return cb(e);
  }

  // Cast values when reading off of disk.  Essentially, unserialize the records.
  for (var collectionName in state.data) {
    state.data[collectionName] = this._unserialize(collectionName, state.data[collectionName]);
  }

  self.data = state.data;
  self.schemas = state.schemas;
  self.counters = state.counters;

  cb(null, { data: state.data, schemas: state.schemas, counters: state.counters });
};

///////////////////////////////////////////////////////////////////////////////////////////
/// DDL
///////////////////////////////////////////////////////////////////////////////////////////

/**
 * Register a new Collection
 *
 * @param {String} collectionName
 * @param {Object} definition
 * @param {Function} callback
 * @return Object
 * @api public
 */

Application.prototype.createCollection = function(collectionName, definition, cb) {
  var self = this;

  this.setCollection(collectionName, { definition: definition }, function(err, collection) {
    if(err) return cb(err);

    self.write(collectionName, function() {
      cb(null, collection.schemas);
    });
  });
};

/**
 * Describe a collection
 *
 * @param {String} pathname
 * @param {Function} cb
 * @api public
 */
Application.prototype.describe = function(pathname) {
  const schema = this.database.ref('schemas').child(pathname);

  const resolve = function(snapshot) {
    return snapshot.exists() ? snapshot.val() : null;
  };

  return schema.once('value').then(resolve);
};

/**
 * Drop a Collection
 *
 * @param {String} collectionName
 * @api public
 */

Application.prototype.deleteCollection = function(collectionName, relations, cb) {
  var self = this;

  if(typeof relations === 'function') {
    cb = relations;
    relations = [];
  }

  // FIXME: Remove on final version
  // If no filePath is set for this collection, return an error in the object
  if(!this.filePath) return {
    error: new Error('No filePath was configured for this collection')
  };

  delete this.data[collectionName];
  delete this.schemas[collectionName];

  relations.forEach(function(relation) {
    delete self.data[relation];
    delete self.schemas[relation];
  });

  const onResolve = function () {
    return self.write(collectionName, cb);
  };

  const onReject = function (error) {
    return cb(error);
  };

  this.drop(collectionName).then(onResolve, onReject);
};

///////////////////////////////////////////////////////////////////////////////////////////
/// DQL
///////////////////////////////////////////////////////////////////////////////////////////

/**
 * Select
 *
 * @param {String} collectionName
 * @param {Object} options
 * @param {Function} cb
 * @api public
 */

Application.prototype.select = function(collectionName, options, cb) {
  this.find(collectionName, options)
    .then(function(collections) {
    }).catch((error) => console.error(error));

  // Filter Data based on Options criteria
  var collectionSchema = this.schemas[collectionName] || {};
  var resultSet = WaterlineCriteria(collectionName, this.data, options, collectionSchema);

  // Process Aggregate Options
  var aggregate = new Aggregate(options, resultSet.results);

  if(aggregate.error) return cb(aggregate.error);
  cb(null, aggregate.results);
};

/**
 * Insert A Record
 *
 * @param {String} collectionName
 * @param {Object} values
 * @param {Function} callback
 * @return {Object}
 * @api public
 */

Application.prototype.insert = function(collectionName, values, cb) {

  // FIXME: Remove on final version
  // If no filePath is set for this collection, return an error in the object
  if(!this.filePath) return cb(new Error('No filePath was configured for this collection'));

  var self = this;

  var newRecordCount = 0;

  var originalValues = _.clone(values);
  if(!Array.isArray(values)) values = [values];

  // // To hold any uniqueness constraint violations we encounter:
  // var constraintViolations = [];

  // Iterate over each record being inserted, deal w/ auto-incrementing
  // and checking the uniquness constraints.
  for (var i in values) {
    var record = values[i];

    // en

    // Auto-Increment any values that need it
    record = self.autoIncrement(collectionName, record);
    record = self._serialize(collectionName, record);

    if (!self.data[collectionName]) return cb(WaterlineErrors.CollectionNotRegistered);
    self.data[collectionName].push(record);

    // FIXME
    newRecordCount++;
  }

  self.database.ref('counts').child(collectionName).transaction(function(count) {
      return count + newRecordCount;
    })
    .catch(cb);

  this.write(collectionName, function() {
    cb(null, Array.isArray(originalValues) ? values : values[0]);
  });
};

/**
 * Update A Record
 *
 * @param {String} collectionName
 * @param {Object} options
 * @param {Object} values
 * @param {Function} callback
 * @api public
 */

Application.prototype.update2 = function(collectionName, options, values, cb) {
  var self = this;

  // Filter Data based on Options criteria
  var collectionSchema = this.schemas[collectionName] || {};
  var resultSet = WaterlineCriteria(collectionName, this.data, options, collectionSchema);

  // Otherwise, success!
  // Build up final set of results.
  var results = [];

  for (var i in resultSet.indices) {
    var matchIndex = resultSet.indices[i];
    var _values = self.data[collectionName][matchIndex];

    // Clone the data to avoid providing raw access to the underlying
    // in-memory data, lest a user makes inadvertent changes in her app.
    self.data[collectionName][matchIndex] = _.extend(_values, values);
    results.push(_.cloneDeep(self.data[collectionName][matchIndex]));
  }

  self.write(collectionName, function() {
    cb(null, results);
  });
};

/**
 * Destroy a record
 *
 * @param {String} pathname
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */

Application.prototype.delete = function(pathname, options, cb) {
  const self = this;

  if (!self.schemas[pathname]) {
    return cb(new Error(WaterlineErrors.CollectionNotRegistered));
  }

  // Filter Data based on Options criteria
  var schema = this.schemas[pathname] || {};
  var resultSet = WaterlineCriteria(pathname, this.data, options, schema);

  this._destroyRecords(pathname, this.data, options);

  self.data[pathname] = _.reject(this.data[pathname], function (model, i) {
    return _.includes(resultSet.indices, i);
  });

  self.write(pathname, function() {
    return cb(null, resultSet.results);
  });
};

///////////////////////////////////////////////////////////////////////////////////////////
/// CONSTRAINTS
///////////////////////////////////////////////////////////////////////////////////////////

/**
 * Auto-Increment values based on schema definition
 *
 * @param {String} collectionName
 * @param {Object} values
 * @return {Object}
 * @api private
 */

Application.prototype.autoIncrement = function(collectionName, values) {
  var self = this;

  for (var attrName in this.schemas[collectionName]) {
    var attrDef = this.schemas[collectionName][attrName];

    // Only apply autoIncrement if we're supposed to!
    if(!attrDef.autoIncrement) continue;

    // Set initial counter value to 0 for this attribute if not set
    if(!this.counters[collectionName][attrName]) this.counters[collectionName][attrName] = 0;

    // If peeps are manually setting the AI field, keep the counter ahead.
    // Otherwise, increment the counter and set the field.
    if(values[attrName]) {

        if (values[attrName] > this.counters[collectionName][attrName]) {
            this.counters[collectionName][attrName] = values[attrName];
        }

    } else {

        // Increment AI counter
        this.counters[collectionName][attrName]++;
        // this.counters[collectionName][attrName] = self.database.ref(collectionName).push().key;
        // Set data to current auto-increment value
        values[attrName] = self.database.ref(collectionName).push().key;
    }

  }

  return values;
};

/**
 * @param  {String} collectionIdentity
 * @return {String}
 * @api private
 */
Application.prototype.getPKField = function (collectionIdentity) {
  return getPrimaryKey(this.schemas[collectionIdentity]);
};

/**
 * Convenience method to grab the name of the primary key attribute,
 * given the schema.
 *
 * @param  {Object} schema
 * @return {String}
 * @api private)
 */
function getPrimaryKey (schemas) {
  var pkAttrName;
  _.each(schemas, function (def, attrName) {
    if (def.primaryKey) pkAttrName = attrName;
  });
  return pkAttrName;
}

Application.prototype._destroyRecords = function(pathname, collections, options) {
  const self = this;
  const counts = self.database.ref('counts').child(pathname);
  const data = self.database.ref('data').child(pathname);
  const promises = [];

  if (!self.schemas[pathname]) {
    const error = new Error(WaterlineErrors.CollectionNotRegistered);
    return Promise.reject(error);
  }

  // const query = WaterlineCriteria(pathname, collections, options, self.schemas[pathname]);

  return this.destroy(pathname, collections);
};

/**
 * Register Collection
 *
 * @param {String} collectionName
 * @param {Object} collection
 * @param {Function} callback
 * @api public
 */
Application.prototype._registerCollection = function(pathname, collection) {
  return Promise.all([
    this.database.ref('counts').child(pathname).set(0),
    this.database.ref('schemas').child(pathname).set(collection.definition)
  ]);
};
















/**
 * Define a collection at Firebase database
 *
 * @param {String} pathname
 * @param {Object} Sails.js model definition
 * @returns {Promise}
 * @api public
 */
Application.prototype.define = function(pathname, definition) {
  const self = this;

  self.schemas[pathname] = definition ? _.cloneDeep(definition) : {};

  return Promise.all([
    self.database.ref('counts').child(pathname).set(0),
    self.database.ref('schemas').child(definition).set(definition)
  ]);
};

/**
 * Destroy all documents matching a criteria object in a collection.
 *
 * @param {String} pathname
 * @param {Object} options
 * @returns {Promise}
 */
Application.prototype.destroy = function(pathname, options) {
  const self = this;
  const counts = self.database.ref('counts').child(pathname);
  const data = self.database.ref('data').child(pathname);

  const destroyData = function(document) {
    const resolve = function() {
      return document;
    };

    return data.child(document.id).set(null).then(resolve);
  };

  const decrementCount = function(document) {
    const transactionUpdate = function(count) {
      return count - 1;
    };

    const resolve = function() {
      return document;
    };

    return counts.child(document.id).transaction(transactionUpdate).then(resolve);
  };

  const destroyDocumentsFound = function(documents) {
    const promises = [];

    const resolve = function() {
      return documents;
    };

    documents.forEach(function(document) {
      promises.push(Promise.resolve(document)
        .then(destroyData)
        .then(decrementCount));
    });

    return Promise.all(promises).then(resolve);
  };

  return self.find(pathname, options).then(destroyDocumentsFound);
};

/**
 * Drop collection, i.e. delete definition, documents and documents count
 *
 * @param {String} pathname
 * @api public
 */
Application.prototype.drop = function(pathname) {
  return Promise.all([
    this.database.ref('counts').child(pathname).set(null),
    this.database.ref('data').child(pathname).set(null),
    this.database.ref('schemas').child(pathname).set(null)
  ]);
};

/**
 * Find all matching documents at Firebase database
 *
 * @param {String} pathname
 * @param {Object} options
 * @returns {Promise} Documents found at Firebase or request error
 */
Application.prototype.find = function(pathname, options) {
  const self = this;
  const reference = self.database.ref('data').child(pathname);

  if (!self.schemas[pathname]) {
    const error = new Error(WaterlineErrors.CollectionNotRegistered);
    return Promise.reject(error);
  }

  if (!options) {
    return reference.once('value').then(this._onGetDocuments);
  }

  const aggregate = function(collection) {
    const aggregate = new Aggregate(options, collection);
    if (aggregate.error) throw aggregate.error;
    return aggregate.results;
  };

  const filter = function(collection) {
    const data = {};
    data[pathname] = collection;
    const schema = self.schemas[pathname];
    return WaterlineCriteria(pathname, data, options, schema).results;
  };

  return reference.once('value')
    .then(this._onGetDocuments)
    .then(filter)
    .then(aggregate);
};

Application.prototype._onGetDocuments = function onGetDocuments(snapshot) {
  const collection = [];

  if (snapshot && snapshot.exists()) {
    const records = snapshot.val();
    Object.keys(records).forEach(function(key) {
      collection.push(records[key]);
    });
  }

  return collection;
};

/**
 * Serialize document
 *
 * Serializes a collection record into a Firebase document
 *
 * @param {String} pathname
 * @param {Object} record
 * @return {Object} Firebase document
 * @api private
 */
Application.prototype._serialize = function serializeDocument(pathname, record) {
  var self = this;

  const isJsonAttribute = function(attribute) {
    if (!self.schemas[pathname] || !self.schemas[pathname].hasOwnProperty(attribute)) {
      return false;
    }

    return self.schemas[pathname][attribute].type === 'json'
  };

  Object.keys(record).forEach(function(attribute) {
    if (!isJsonAttribute(attribute)) return;

    try {
      record[attribute] = JSON.parse(record[attribute]);
    } catch (error) {
      return;
    }

  });

  return record;
};

/**
 * Unserialize Firebase document into collection record
 *
 * @param {String} pathname
 * @param {Object} document
 * @return {Object} Collection record
 * @api private
 */
Application.prototype._unserialize = function unserializeDocument(pathname, document) {
  const self = this;

  if (!Array.isArray(document)) {
    document = [ document ];
  }

  return document.map(function(collection) {
    return self.collections[pathname]._cast.run(collection);
  });
};

module.exports = Application;
