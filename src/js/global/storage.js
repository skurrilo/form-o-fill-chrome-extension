/*global Utils, Logger, JSONF */
"use strict";
var Storage = {
  load: function(keyToLoadFrom) {
    var key = keyToLoadFrom || Utils.keys.rules;
    return new Promise(function (resolve) {
      chrome.storage.local.get(key, function (persistedData) {
        Logger.info("[storage.js] loaded '" + key + "' = " + JSONF.stringify(persistedData));
        resolve(persistedData[key]);
      });
    });
  },
  save: function (rulesCode, keyToSaveTo) {
    return new Promise(function (resolve, reject) {
      var value = {};
      var key = keyToSaveTo || Utils.keys.rules;
      value[key] = rulesCode;
      chrome.storage.local.set(value, function () {
        if(typeof chrome.runtime.lastError === "undefined") {
          Logger.info("[storage.js] Saved '" + key + "' = " + JSONF.stringify(value[key]));
          resolve(true);
        } else {
          reject(Error(chrome.runtime.lastError));
        }
      });
    });
  },
  delete: function (key) {
    return new Promise(function (resolve, reject) {
      chrome.storage.local.remove(key, function () {
        if(typeof chrome.runtime.lastError === "undefined") {
          Logger.info("[storage.js] Removed key '" + key + "'");
          resolve(true);
        } else {
          reject(Error(chrome.runtime.lastError));
        }
      });
    });
  }
};

