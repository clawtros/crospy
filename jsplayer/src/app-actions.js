var AppConstants = require('./app-constants'),
    AppDispatcher = require('./app-dispatcher');

module.exports = {
  keyEntered: function(cellId, character, room, source) {
    console.log(source);
    AppDispatcher.handleViewAction({
      actionType: AppConstants.KEY_ENTERED,
      event: { cellId: cellId, character: character, room: room, source: source }
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
