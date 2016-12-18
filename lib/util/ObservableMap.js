/**
 * Copyright (c) 2016 Joao Paulo Fernandes Ventura
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

const Promise = require('bluebird');

const ObservableMap = function ObservableMap(firebaseDatabaseReference) {
  this._identity = firebaseDatabaseReference.toString().split('/').reverse()[0];
  this._firebase = firebaseDatabaseReference;
};

ObservableMap.prototype.subscribe = function subscribe(callback) {
  this._onChange = callback;
  this._firebase.on('child_added', this._onChildAdded, this._onError, this);
  this._firebase.on('child_changed', this._onChildChanged, this._onError, this);
  this._firebase.on('child_moved', this._onChildMoved, this._onError, this);
  this._firebase.on('child_removed', this._onChildRemoved, this._onError, this);
};

ObservableMap.prototype.unsubscribe = function unsubscribe() {
  this._onChange = null;
  this._firebase.on('child_added', this._onChildAdded, this);
  this._firebase.on('child_changed', this._onChildChanged, this);
  this._firebase.on('child_moved', this._onChildMoved, this);
  this._firebase.on('child_removed', this._onChildRemoved, this);
};

ObservableMap.prototype.get = function get(key) {
  return Promise.resolve(this[key]);
};

ObservableMap.prototype.put = function put(key, value) {
  const self = this;

  const callable = function(resolve, reject) {
    return self._firebase.child(key)
      .set(value)
      .then(function () {
        return resolve(value);
      })
      .catch(reject);
  };

  return new Promise(callable);
};

ObservableMap.prototype.remove = function remove(key) {
  return this.put(key, null);
};

ObservableMap.prototype._onChildAdded = function onChildAdded(snapshot) {
  this[snapshot.key] = snapshot.exists() ? snapshot.val() : null;
  return this._onChange(this._identity, snapshot.key, 'add', null);
};

ObservableMap.prototype._onChildChanged = function onChildChanged(snapshot) {
  const oldValue = this[snapshot.key];
  this[snapshot.key] = snapshot.exists() ? snapshot.val() : oldValue;
  return this._onChange(this._identity, snapshot.key, 'update', oldValue);
};

ObservableMap.prototype._onChildMoved = function onChildMoved(snapshot) {
  return this._onChildChanged(snapshot);
};

ObservableMap.prototype._onChildRemoved = function onChildRemoved(snapshot) {
  const oldValue = this[snapshot.key];
  this[snapshot.key] = null;
  return this._onChange(this._identity, snapshot.key, 'delete', oldValue);
};

ObservableMap.prototype._onError = function onError(error) {
  return console.error(error);
};

module.exports = ObservableMap;
