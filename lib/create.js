const Document = require('./document');

/**
 * Create a collection
 *
 * @param {String}   pathname
 * @param {Object}   collection
 * @param {Function} collection
 * @api private
 */
const Create = function(pathname, collection, cb) {
  const reference = this.database.ref(pathname);

  if (Array.isArray(collection)) {
    const collections = [];
    const documents = {};

    collection.forEach((item) => {
      const document = new Document(item);
    document.id = item.id || reference.push().key;
    documents[document.id] = document.toJSON();
    collections.push(document);
  });

    return reference.set(documents)
        .then(() => cb(null, collections))
  .catch((error) => cb(error));
  }

  const document = new Document(collection);
  document.id = collection.id || reference.push().key;

  return reference.child(document.id)
      .set(document.toJSON())
      .then(() => cb(null, document))
  .catch((error) => cb(error));
};

module.exports = Create;
