/*global fetch, require, module */

var AppDispatcher = require('./app-dispatcher'),
    AppConstants = require('./app-constants'),
    assign = require('object-assign'),
    EventEmitter = require('events').EventEmitter;

function _generateCrossword(callback, errors) {
    errors = errors || 0;
    fetch('/api/random/')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            callback(data);
        })
        .catch(function(err) {
            console.log("RETRYING ", errors, err);
            if (errors < 10) {
                _generateCrossword(callback, errors + 1);
            }
        });
}

function _loadCrossword(crosswordId, callback) {
    fetch('/api/grid/' + crosswordId + '/')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            callback(data);
        });
}

function _loadValues(crosswordId, callback) {
    fetch('/api/grid/' + crosswordId + '/')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            callback(data);
        });
}

var CrosswordStore = assign(EventEmitter.prototype, {
    emitChange: function() {
        this.emit(AppConstants.CHANGE_EVENT);
    },

    addChangeListener: function(callback) {
        this.on(AppConstants.CHANGE_EVENT, callback);
    },
    
    removeChangeListener: function(callback) {
        this.removeListener(AppConstants.CHANGE_EVENT, callback);
    },

    getValues: function(crosswordId) {
        return [];
    },
    
    dispatcherIndex: AppDispatcher.register(function(payload) {
        var action = payload.action;
        switch (action.actionType) {
        case AppConstants.KEY_ENTERED:
            CrosswordStore.emit(AppConstants.CHANGE_EVENT, payload.event);
            break;

        case AppConstants.LOAD_CROSSWORD:
            _loadCrossword(action.crosswordId, function(data) {
                CrosswordStore.emit(AppConstants.LOADED_EVENT, data);
            });
            break;
        case AppConstants.REQUEST_CROSSWORD:
            _generateCrossword(function(data) {
                CrosswordStore.emit(AppConstants.GENERATED_EVENT, data);
            });
            break;
        }
    })
});

module.exports = CrosswordStore;
