var AppConstants = require('./app-constants'),
    AppDispatcher = require('./app-dispatcher');

module.exports = {
  keyEntered: function(cellId, character) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.KEY_ENTERED,
      event: { cellId: cellId, character: character }
    });
  },

  loadCrossword: function(crosswordId) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.LOAD_CROSSWORD,
      crosswordId: crosswordId
    });    
  },

  requestCrossword: function() {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.REQUEST_CROSSWORD
    });
    
  }
}
