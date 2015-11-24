import Crossword from './components/Crossword.jsx';
import CrosswordStore from './CrosswordStore';

(function(window) {
  
  var React = require('react'),
      ReactDOM = require('react-dom'),
      $ = require('jquery'),
      CrosswordModel = require('./models/CrosswordModel.js'),
      AppActions = require('./app-actions'),

      numloadingcells = 15 * 15,
      data = require('./data.js'),
      testLoading = true,
      makeLoader = function() {
        var container = $('#loading_container');
        for (var i = 0; i < numloadingcells; i++) {
          container.append('<div class="foo"></div>');
        }
        function randomlyFlip() {
          var targetIndex = parseInt(Math.random() * numloadingcells / 2),
              target = $($('.foo')[targetIndex]),
              oppositeTarget = $($('.foo')[numloadingcells - targetIndex -1]);
          target.toggleClass('highlighted');
          oppositeTarget.toggleClass('highlighted');
        }
        return setInterval(randomlyFlip, 100);
      },
      interval;

  function finalizeGrid(data) {
    var model = new CrosswordModel(data.cells, data.gridinfo.size, data);
    ReactDOM.render(<Crossword crosswordId={data._id} model={model} rawData={data} title={data.gridinfo.name} clues={data.clues} numbered={data.numbered} cells={data.cells} size={data.gridinfo.size}/>, document.getElementById('app'));
    $('.loading').addClass('out');
    $('#app').removeClass('out');
    clearInterval(interval);
  }

  console.log(CrosswordStore);
  CrosswordStore.on('generated', function(data) {
    finalizeGrid(data);
    window.history.pushState({id: data._id}, 'Random Crossword', '/' + data._id + '/')
  });

  CrosswordStore.on('loaded', finalizeGrid);

  function generateCrossword() {
    interval = makeLoader();
    AppActions.requestCrossword();
  }

  function loadCrossword(crossword_id) {
    interval = makeLoader();
    AppActions.loadCrossword(crossword_id);
  }

  window.generateCrossword = generateCrossword;
  window.loadCrossword = loadCrossword;
})(window);
