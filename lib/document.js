const _ = require('lodash');

function isDate(value) {
  return toString.call(value) === '[object Date]';
}

function isNull(value) {
  return (value === null) || (value === undefined);
}

function isPrimitive(value) {
  if (typeof value === 'boolean') {
    return true;
  }

  if (typeof value === 'number') {
    return true;
  }

  if (typeof value === 'string') {
    return true;
  }
}

class FirebaseDocument {
  static newArray(collections) {
  }

  constructor(object) {
    Object.keys(object).forEach((key) => {
      if (isNull(object[key])) {
      return;
    }
    this[key] = object[key];
  });

    if (!object.createdAt) {
      this.createdAt = this.updatedAt = new Date();
    }
  }

  toJSON() {
    const document = _.cloneDeep(this);
    Object.keys(document).forEach((key) => {
      if (isDate(document[key])) {
      document[key] = document[key].toISOString();
    }
  });
    delete document.id;

    return document;
  }
}

module.exports = FirebaseDocument;
