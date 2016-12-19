/**
 * Module dependencies
 */

var _ = require('lodash');
var Errors = require('waterline-errors').adapter;
var _runJoins = require('waterline-cursor');
var Application = require('./application');





/*---------------------------------------------------------------
  :: DiskAdapter
  -> adapter

  This disk adapter is for development only!
---------------------------------------------------------------*/
module.exports = (function () {

  // Hold connections for this adapter
  var connections = {};

  var adapter = {

    identity: 'sails-disk',

    // Which type of primary key is used by default
    pkFormat: 'string',

    // Whether this adapter is syncable (yes)
    syncable: true,

    // Allow a schemaless datastore
    defaults: {
      schema: false,
      filePath: '.tmp/'
    },

    // Register A Connection
    registerConnection: function (connection, collections, cb) {

      if(!connection.identity) return cb(Errors.IdentityMissing);
      if(connections[connection.identity]) return cb(Errors.IdentityDuplicate);

      connections[connection.identity] = new Application(connection, collections);
      connections[connection.identity].initializeApplication(cb);
    },

    // Teardown a Connection
    teardown: function (conn, cb) {

      if (typeof conn == 'function') {
        cb = conn;
        conn = null;
      }
      if (conn == null) {
        connections = {};
        return cb();
      }
      if(!connections[conn]) return cb();
      delete connections[conn];
      cb();
    },

    describe: function (conn, coll, cb) {
      const resolve = function(schema) {
        return cb(null, schema);
      };

      grabConnection(conn).describe(coll).then(resolve).catch(cb);
    },

    define: function (conn, coll, definition, cb) {
      grabConnection(conn).createCollection(coll, definition, cb);
    },

    drop: function (conn, coll, relations, cb) {
      grabConnection(conn).deleteCollection(coll, relations, cb);
    },

    find: function (conn, coll, options, cb) {
      grabConnection(conn).select(coll, options, function (error, data) {
        return cb(null, data);
      });
    },

    create: function (conn, coll, values, cb) {
      grabConnection(conn).insert(coll, values, cb);
    },

    update: function (conn, coll, options, values, cb) {
      grabConnection(conn).update(coll, options, values, cb);
    },

    destroy: function (conn, coll, options, cb) {
      grabConnection(conn).delete(coll, options, cb);
    }

  };

  adapter.createEach = adapter.create;

  /**
   * Grab the connection object for a connection name
   *
   * @param {String} connectionName
   * @return {Object}
   * @api private
   */

  function grabConnection(connectionName) {
    return connections[connectionName];
  }

  return adapter;
})();
