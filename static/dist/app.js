(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

function _loadCrossword(crossword_id, callback) {
    fetch('/api/grid/' + crossword_id + '/')
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

    dispatcherIndex: AppDispatcher.register(function(payload) {
        var action = payload.action;
        switch (action.actionType) {
        case AppConstants.KEY_ENTERED:
            
            break;
        case AppConstants.LOAD_CROSSWORD:
            _loadCrossword(action.crossword_id, function(data) {
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

},{"./app-constants":3,"./app-dispatcher":4,"events":16,"object-assign":21}],2:[function(require,module,exports){
var AppConstants = require('./app-constants'),
    AppDispatcher = require('./app-dispatcher');

module.exports = {
  keyEntered: function(keyEvent) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.KEY_ENTERED,
      event: keyEvent
    });
  },
  
  loadCrossword: function(crossword_id) {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.LOAD_CROSSWORD,
      crossword_id: crossword_id
    });    
  },

  requestCrossword: function() {
    AppDispatcher.handleViewAction({
      actionType: AppConstants.REQUEST_CROSSWORD
    });
    
  }
}

},{"./app-constants":3,"./app-dispatcher":4}],3:[function(require,module,exports){
module.exports = {
  KEY_ENTERED: "KEY_ENTERED",
  LOAD_CROSSWORD: "LOAD_CROSSWORD",
  REQUEST_CROSSWORD: "REQUEST_CROSSWORD",
  GENERATED_EVENT: 'generated',
  LOADED_EVENT: 'loaded',
  CHANGE_EVENT: 'change'
}

},{}],4:[function(require,module,exports){
var Dispatcher = require('flux').Dispatcher,
    assign = require('object-assign'),
    AppDispatcher = assign(new Dispatcher(), {
      handleViewAction: function(action) {
        console.log('action', action);
        this.dispatch({
          source: "VIEW_ACTION",
          action: action
        });
      }
    });

module.exports = AppDispatcher;

},{"flux":19,"object-assign":21}],5:[function(require,module,exports){
/*global fetch, React, _, require, clearInterval, setInterval, $ */

(function(React, _) {
  var Crossword = require('./components/Crossword.jsx'),
      CrosswordModel = require('./models/CrosswordModel.js'),
      AppActions = require('./app-actions'),
      CrosswordStore = require('./CrosswordStore'),
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
    React.render(React.createElement(Crossword, {model: model, rawData: data, title: data.gridinfo.name, clues: data.clues, numbered: data.numbered, cells: data.cells, size: data.gridinfo.size}), document.getElementById('app'));
    $('.loading').addClass('out');
    $('#app').removeClass('out');
    clearInterval(interval);
  }
  
  CrosswordStore.on('generated', function(data) {
    finalizeGrid(data);
    window.history.pushState({id: data._id}, 'Random Crossword', '/' + data._id + '/')
  });

  CrosswordStore.on('loaded', finalizeGrid);
  
  function generateCrossword() {
    var interval = makeLoader();
    // TODO: HANDLE ERRORS, HAHAHA
    AppActions.requestCrossword();
  }

  function loadCrossword(crossword_id) {
    var interval = makeLoader();
    AppActions.loadCrossword(crossword_id);
  }

  window.generateCrossword = generateCrossword;
  window.loadCrossword = loadCrossword;
  
}(React, _));

},{"./CrosswordStore":1,"./app-actions":2,"./components/Crossword.jsx":9,"./data.js":12,"./models/CrosswordModel.js":13}],6:[function(require,module,exports){
(function(React, module, undefined) {
  module.exports = React.createClass({displayName: "exports",
    render: function() {
      var fontSize = this.props.size * 0.35,
          style = {
            width: this.props.size + "%",
            fontSize: fontSize + 'vmin',
            paddingTop: this.props.size + "%"
          },
          classes = React.addons.classSet({
            'cell': true,
            'incorrect': this.props.value && this.props.highlightErrors && this.props.value.toLowerCase() != this.props.correctValue.toLowerCase(),
            'input-cell': this.props.selected,
            'flex-centered': true,
            'focused': this.props.focused === true,
            'unplayable': !this.props.playable
          });
      return (
        React.createElement("div", {style: style, className: classes}, 
          React.createElement("div", {className: "cell-number"}, this.props.number), 
          React.createElement("div", {onClick: this.props.onClick, 
               className: "cell-content flex-centered"}, 
            this.props.playable ? (this.props.reveal ? this.props.correctValue : this.props.value) : ""
          )
        )
      );
    }
  });
}(React, module));

},{}],7:[function(require,module,exports){
(function(React, module, undefined) {
  // TODO: Rename this to Grid or somesuch
  var Keyboard = require('./Keyboard.jsx'),
      Cell = require('./Cell.jsx'),
      UNPLAYABLE = "#",
      DIRECTIONS = require('../models/Directions.js');

  module.exports = React.createClass({displayName: "exports",
    getInitialState: function() {
      return {
        direction: DIRECTIONS.ACROSS,
        cellValues: []
      }
    },
    
    makeActive: function(id) {
      if (this.props.values[id] !== UNPLAYABLE) {
        this.props.makeActive(id);
      }
    },

    handleLetter: function(character) {
      var nextCell = this.nextCellFrom(this.props.activeCell, 1, this.props.direction);
      this.state.cellValues[this.props.activeCell] = character;

      //TODO: figure out some good next word logic here.  this gets a bit weird
//      if ((this.props.values[nextCell] !== UNPLAYABLE) && Math.abs(this.props.activeCell - nextCell) <= this.props.size) {
//        this.go(1);
//      } else {
//        this.props.skipWord(1);
//      }
      this.go(1);
    },

    handleBackspace: function() {
      if (this.state.cellValues[this.props.activeCell] == undefined) {
        this.go(-1);
        this.state.cellValues[this.props.activeCell] = undefined;
      } else {
        this.state.cellValues[this.props.activeCell] = undefined;
        this.go(-1);
      }

    },
    
    handleKeyDown: function(e) {
      if (this.props.activeCell !== undefined) {
        var values = this.state.cellValues,
            direction = this.props.direction;
        
        if (e.which == 8) {
          e.preventDefault();
          e.stopPropagation();
          this.handleBackspace();
        }

        if (e.which == 9) {
          e.preventDefault();
          e.stopPropagation();
          this.props.skipWord(e.shiftKey ? -1 : 1);
        }
        
        if (e.which >= 65 && e.which <= 90 && !e.metaKey && !e.ctrlKey) {
          this.handleLetter(String.fromCharCode(e.which));
        }

        if (e.which >= 37 && e.which <= 40) {
          e.preventDefault();
          e.stopPropagation();

          if (e.shiftKey) {
            switch (e.which) {
              case 37:
                this.go(-1, DIRECTIONS.ACROSS);
                break;
              case 39:
                this.go(1, DIRECTIONS.ACROSS);
                break;              
              case 38:
                this.go(-1, DIRECTIONS.DOWN);
                break;
              case 40:
                this.go(1, DIRECTIONS.DOWN);
                break;
            }            
          } else {
            switch (e.which) {
              case 37:
                if (direction == DIRECTIONS.ACROSS) {
                  this.go(-1);
                } else {
                  this.props.toggleDirection();
                }
                break;
              case 39:
                if (direction == DIRECTIONS.ACROSS) {
                  this.go(1);
                } else {
                  this.props.toggleDirection();
                }
                break;              
              case 38:
                if (direction == DIRECTIONS.DOWN) {
                  this.go(-1);
                } else {
                  this.props.toggleDirection();
                }
                break;
              case 40:
                if (direction == DIRECTIONS.DOWN) {
                  this.go(1);
                } else {
                  this.props.toggleDirection();
                }
                break;
            }
          }
        }

        this.setState({
          direction: direction,
          cellValues: values
        });        
      }
    },
                                     
    nextCellFrom: function(cell, delta, direction) {      
      cell += (direction == DIRECTIONS.ACROSS ? 1 : this.props.size) * delta;      
      if (cell >= this.props.values.length) {
        cell -= this.props.values.length;
      }      
      if (cell < 0) {
        cell = this.props.values.length + cell;
      }      
      return cell;
    },

    closeKeyboard: function() {
      this.props.closeKeyboard();
    },
    
    go: function(delta, direction) {
      var direction = direction || this.props.direction,
          initial = this.nextCellFrom(this.props.activeCell, delta, direction),
          next = initial;
      
      while (this.props.values[next] === UNPLAYABLE) {        
        next = this.nextCellFrom(next, delta, direction);
      }
      
      this.props.makeActive(next);
    },
    
    componentDidMount: function() {
      window.addEventListener('dblclick', this.toggleDirection);
      window.addEventListener('keydown', this.handleKeyDown);
    },

    componentWillUnmount: function() {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('dblclick', this.handleDoubleClick);
    },

    handleDoubleClick: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDirection();
    },

    toggleDirection: function() {
      this.props.toggleDirection();
    },
    
    render: function() {
      var size = this.props.size,
          numbers = this.props.numbered,
          count = 1,
          highlightedCells = this.props.highlightedCells;
      
      for (var k in numbers) {
        numbers[k] = count++;
      }

      // TODO: Keyboard needs a better interface, obvs
      return (
        React.createElement("div", null, 
          React.createElement(Keyboard, {show: this.props.showKeyboard, 
                    nextHandler: this.props.skipWord, 
                    directionHandler: this.toggleDirection, 
                    closeHandler: this.closeKeyboard, 
                    backspaceHandler: this.handleBackspace, 
                    keyHandler: this.handleLetter}), 
          React.createElement("div", {className: "cell-list"}, 
            this.props.values.split("").map(function(cell, id) {
              return (
                React.createElement(Cell, {onClick: this.makeActive.bind(this, id), 
                number: numbers[id + 1], 
                reveal: this.props.revealEverything, 
                focused: highlightedCells.indexOf(id) > -1, 
                selected: id == this.props.activeCell, 
                highlightErrors: this.props.highlightErrors, 
                key: id, 
                value: this.state.cellValues[id], 
                playable: cell !== UNPLAYABLE, 
                correctValue: cell, 
                size: 100 / size}));
             }, this), 
                
                React.createElement("div", {className: "clearfix"})
          )
        )
      );
    }
  });
}(React, module));

},{"../models/Directions.js":14,"./Cell.jsx":6,"./Keyboard.jsx":11}],8:[function(require,module,exports){
(function (React, module, undefined) {
  module.exports = React.createClass({displayName: "exports",
    handleClick: function(clueId) {
      this.props.handleClueClick(clueId, this.props.directionEnum);
    },

    componentDidUpdate: function() {
      var node = this.getDOMNode(),
          container = $(node).find('.clue-list-container'),
          activeClue = container.find('.active-clue');
      if (activeClue.length > 0) {
        var newTop = activeClue.offset().top - container.offset().top - container.height() / 2 + activeClue.height() / 2;
        container.scrollTop(container.scrollTop() + newTop);
      }
    },
    
    render: function () {
      var activeClue = this.props.activeClue,
          templated = Object.keys(this.props.clues).map(function(clueId) {
            var clue = this.props.clues[clueId],
                classes = React.addons.classSet({
                  'clue-container': true,
                  'active-clue': parseInt(clueId) === activeClue
                });
            return (
              React.createElement("li", {className: classes, onClick: this.handleClick.bind(this, clueId, this.props.directionEnum), key: this.props.direction + "_" + clueId}, 
                React.createElement("div", {className: "clue-phrase"}, 
                  React.createElement("div", {className: "clue-number"}, clue.clue_number), 
                  clue.clue_text
                )
              )
            )
          }, this);
      
      return React.createElement("div", null, 
       React.createElement("h2", {className: "clue-list-header"}, this.props.direction), 
       React.createElement("div", {className: "clue-list-container"}, 
         React.createElement("ul", {className: "clue-list"}, 
           templated
         )
       )
      )
    }
  });
}(React, module));

},{}],9:[function(require,module,exports){
(function(React, module, undefined) {
  var Cells = require('./Cells.jsx'),
      ClueList = require('./ClueList.jsx'),
      CurrentClue = require('./CurrentClue.jsx'),
      CrosswordModel = require('../models/CrosswordModel.js'),
      Actions = require('../app-actions'),
      UNPLAYABLE = "#",
      DIRECTIONS = require('../models/Directions.js');

  module.exports = React.createClass({displayName: "exports",

    getInitialState: function() {
      return {
        showKeyboard: false,
        revealEverything: false,
        highlightErrors: false,
        activeCell: undefined,
        direction: DIRECTIONS.ACROSS,
      };
    },

    getWordNumber: function(cell, direction) {
      // get the minimum cell from the word
      return this.props.rawData.numbered[
        Math.min.apply(
          this,
          this.props.model.wordAt(cell, direction)
        ) + 1]
    },

    getClueNumbers: function(direction) {
      return Object.keys(direction === DIRECTIONS.ACROSS ? this.props.rawData.clues.Across : this.props.rawData.clues.Down)
                   .map(function(e) { return parseInt(e, 10) });
    },

    handleClueClick: function(clueId, direction) {
      this.state.direction = direction;
      this.handleMakeActive(this.props.model.lookupTable.numberToCell[clueId] - 1);
    },

    handleSkipWord: function(delta) {
      var currentWordNumber = this.getWordNumber(this.state.activeCell, this.state.direction),
          l = this.getClueNumbers(this.state.direction),
          d = delta || 1,
          index = l.indexOf(currentWordNumber) + d,
          // TODO: remove this monstrosity
          target = l[index < 0 ? l.length - 1 : (index >= l.length ? l.length - index : index)];
      this.handleClueClick(target, this.state.direction);
    },

    toggleDirection: function() {
      this.state.direction = this.state.direction == DIRECTIONS.ACROSS ? DIRECTIONS.DOWN : DIRECTIONS.ACROSS;
      this.handleMakeActive(this.state.activeCell);
    },

    handleMakeActive: function(cellId) {
      this.setState({
        activeCell: cellId,
        activeDownClue: this.props.rawData.numbered[
          Math.min.apply(this, this.props.model.wordAt(cellId, DIRECTIONS.DOWN)) + 1
        ],
        activeAcrossClue: this.props.rawData.numbered[
          Math.min.apply(this, this.props.model.wordAt(cellId, DIRECTIONS.ACROSS)) + 1
        ]
      });
    },

    toggleHighlightErrors: function() {
      this.setState({
        highlightErrors: !this.state.highlightErrors
      });
    },

    toggleRevealEverything: function() {
      this.setState({
        revealEverything: !this.state.revealEverything
      });
    },

    toggleKeyboard: function() {
      if (this.state.activeCell === undefined) {
        this.handleSkipWord();
      }
      this.setState({
        showKeyboard: !this.state.showKeyboard
      });
    },

    getClue: function(number, direction) {
      var clues = direction == DIRECTIONS.ACROSS ?
                               this.props.rawData.clues.Across :
                               this.props.rawData.clues.Down;
      return clues[number] || {};
    },

    getCurrentClueNumber: function() {
      return this.state.direction == DIRECTIONS.ACROSS ?
                                     this.state.activeAcrossClue :
                                     this.state.activeDownClue;
    },

    closeKeyboard: function() {
      this.setState({
        showKeyboard: false
      });
    },
    
    render: function() {
      return (
        React.createElement("div", null, 
          React.createElement("div", {className: "row"}, 
            React.createElement("div", {className: "col-xs-12"}, 
              this.state.activeCell !== undefined ? 
              React.createElement(CurrentClue, {direction: this.state.direction, 
               clue: this.getClue(this.getCurrentClueNumber(), this.state.direction)}
               )
                              : React.createElement("h3", {className: "current-clue"}, "Random ", this.props.size, " x ", this.props.size, " Crossword")
                           
            )
          ), 
          React.createElement("div", {className: "row"}, 
            React.createElement("div", {className: "col-md-8"}, 
              React.createElement(Cells, {numbered: this.props.numbered, 
                     highlightedCells: this.props.model.wordAt(this.state.activeCell, this.state.direction), 
                     highlightErrors: this.state.highlightErrors, 
                     revealEverything: this.state.revealEverything, 
                     makeActive: this.handleMakeActive, 
                     activeCell: this.state.activeCell, 
                     direction: this.state.direction, 
                     skipWord: this.handleSkipWord, 
                     showKeyboard: this.state.showKeyboard, 
                     closeKeyboard: this.closeKeyboard, 
                     toggleDirection: this.toggleDirection, 
                     values: this.props.cells, 
                     size: this.props.size}), 
              React.createElement("label", null, 
                React.createElement("input", {type: "checkbox", onChange: this.toggleHighlightErrors, checked: this.state.highlightErrors}), " Show Errors"
              ), 
              React.createElement("label", null, 
                React.createElement("input", {type: "checkbox", onChange: this.toggleRevealEverything, checked: this.state.revealEverything}), " Reveal Answers"
              ), 
              React.createElement("label", {className: "keyboard-label"}, 
                React.createElement("input", {type: "checkbox", onChange: this.toggleKeyboard, checked: this.state.showKeyboard}), " Show Keyboard"
              )
            ), 
            React.createElement("div", {className: "col-md-4"}, 
              React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-xs-6 col-md-12"}, 
                  React.createElement(ClueList, {direction: "Across", 
                            directionEnum: DIRECTIONS.ACROSS, 
                            activeClue: this.state.activeAcrossClue, 
                            clues: this.props.clues.Across, 
                            handleClueClick: this.handleClueClick})
                ), 
                React.createElement("div", {className: "col-xs-6 col-md-12"}, 
                  React.createElement(ClueList, {direction: "Down", 
                            directionEnum: DIRECTIONS.DOWN, 
                            activeClue: this.state.activeDownClue, 
                            clues: this.props.clues.Down, 
                            handleClueClick: this.handleClueClick})
                )
              )
            )
          )
        )
      );
    }
  });
}(React, module));

},{"../app-actions":2,"../models/CrosswordModel.js":13,"../models/Directions.js":14,"./Cells.jsx":7,"./ClueList.jsx":8,"./CurrentClue.jsx":10}],10:[function(require,module,exports){
(function(React, module) {
    var DIRECTIONS = require('../models/Directions.js');
    
    module.exports = React.createClass({displayName: "exports",
        render: function() {
            return (
                React.createElement("h3", {className: "current-clue"}, this.props.clue.clue_number, this.props.direction == DIRECTIONS.ACROSS ? 'A' : 'D', " ", React.createElement("span", {className: "current-clue-text"}, this.props.clue.clue_text))
            );
        }
    });
}(React, module));
},{"../models/Directions.js":14}],11:[function(require,module,exports){
(function (React, module) {
  module.exports = React.createClass({displayName: "exports",
    rows: [
      "qwertyuiop",
      "asdfghjkl",
      "zxcvbnm"
    ],
    
    render: function() {
      var classes = React.addons.classSet({
        onscreen: this.props.show === true,
        keyboard: true
      });
      return (
        React.createElement("div", {className: classes}, 
        React.createElement("div", {className: "keyboard-contents"}, 
        this.rows.map(function(row) {
            return (
              React.createElement("div", {key: row, className: "keyboard-row"}, 
              row.split("").map(function(letter) {
                return React.createElement("div", {className: "keyboard-key keyboard-letter", key: letter, 
                            onClick: this.props.keyHandler.bind(null, letter)}, letter)
              }, this)
              
              )
              )
        }, this), 
        React.createElement("div", {className: "keyboard-key keyboard-backspace", onClick: this.props.backspaceHandler}, "←"), 
        React.createElement("div", {className: "keyboard-key keyboard-close", onClick: this.props.closeHandler}, "CLOSE"), 
        React.createElement("div", {className: "keyboard-key keyboard-next", onClick: this.props.nextHandler.bind(null, 1)}, "→"), 
        React.createElement("div", {className: "keyboard-key keyboard-direction", onClick: this.props.directionHandler}, "A/D")
        )
        )
      )
    }
  });
}(React, module));

},{}],12:[function(require,module,exports){
(function(module) {
    module.exports = {"numbered":{"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"11":11,"12":11,"13":45,"14":46,"15":47,"16":16,"26":21,"31":30,"41":35,"46":38,"50":41,"54":44,"55":53,"58":47,"61":52,"64":56,"70":55,"72":62,"79":58,"81":70,"83":107,"84":95,"87":65,"88":86,"89":87,"90":88,"91":89,"92":90,"93":91,"96":73,"97":106,"102":77,"106":80,"111":85,"115":108,"118":88,"121":92,"124":111,"127":96,"132":115,"136":104,"141":123,"145":110,"146":168,"154":113,"155":149,"161":118,"163":156,"164":157,"165":158,"166":159,"167":160,"168":161,"170":124,"172":164,"174":166,"175":167,"178":130,"181":135,"184":162,"187":144,"188":165,"192":169,"196":149,"202":158,"211":163,"217":172},"gridinfo":{"size":15,"name":"Randomly Generated Crossword","randid":59822},"clues":{"Across":{"1":{"clue_number":1,"clue_text":"European weed naturalized in southwestern United States and Mexico having reddish decumbent stems with small fernlike leaves and small deep reddish-lavender flowers followed by slender fruits that stick straight up; often grown for forage"},"10":{"clue_number":10,"clue_text":"sorghums of dry regions of Asia and North Africa"},"15":{"clue_number":15,"clue_text":"egg cooked briefly in the shell in gently boiling water"},"16":{"clue_number":16,"clue_text":"rhubarb"},"17":{"clue_number":17,"clue_text":"relating to geometry as developed by Euclid"},"18":{"clue_number":18,"clue_text":"having attained a specific age; (`aged' is pronounced as one syllable)"},"19":{"clue_number":19,"clue_text":"convert into ___es"},"20":{"clue_number":20,"clue_text":"an informal term for a father; probably derived from baby talk"},"21":{"clue_number":21,"clue_text":"a corporation's first offer to sell stock to the public"},"23":{"clue_number":23,"clue_text":"make a sweeping movement"},"24":{"clue_number":24,"clue_text":"an American operation in World War I (1918); American troops under Pershing drove back the German armies which were saved only by the armistice on November 11"},"26":{"clue_number":26,"clue_text":"(computer science) the part of a computer (a microprocessor chip) that does most of the data processing"},"28":{"clue_number":28,"clue_text":"the military intelligence agency that provides for the intelligence and counterintelligence and investigative and security requirements of the United States Navy"},"30":{"clue_number":30,"clue_text":"the month following August and preceding October"},"32":{"clue_number":32,"clue_text":"the act of changing your residence or place of business"},"36":{"clue_number":36,"clue_text":"absent without permission"},"39":{"clue_number":39,"clue_text":"a city of central China; capital of ancient Chinese empire 221-206 BC"},"41":{"clue_number":41,"clue_text":"(often followed by `for') ardently or excessively desirous"},"42":{"clue_number":42,"clue_text":"a cluster of hooks (without barbs) that is drawn through a school of fish to hook their bodies; used when fish are not biting"},"43":{"clue_number":43,"clue_text":"large dark-striped tropical food and game fish related to remoras; found worldwide in coastal to open waters"},"45":{"clue_number":45,"clue_text":"an explosive device that is improvised"},"46":{"clue_number":46,"clue_text":"a radical terrorist group dedicated to the removal of British forces from Northern Ireland and the unification of Ireland"},"48":{"clue_number":48,"clue_text":"Scottish chemist noted for his research into the structure of nucleic acids (born in 1907)"},"49":{"clue_number":49,"clue_text":"King of England who was renounced by Northumbria in favor of his brother Edgar (died in 959)"},"50":{"clue_number":50,"clue_text":"a European river; flows into the Baltic Sea"},"51":{"clue_number":51,"clue_text":"a gangster's pistol"},"52":{"clue_number":52,"clue_text":"a diploma given for vocational training that prepares the student for a career in a particular area; good students may progress to a course leading to a degree"},"54":{"clue_number":54,"clue_text":"(formerly) a title of respect for a man in Turkey or Egypt"},"56":{"clue_number":56,"clue_text":"superior in rank or accomplishment"},"60":{"clue_number":60,"clue_text":"voracious snakelike marine or freshwater fishes with smooth slimy usually scaleless skin and having a continuous vertical fin but no ventral fins"},"63":{"clue_number":63,"clue_text":"the ratio of the distance traveled (in kilometers) to the time spent traveling (in hours)"},"65":{"clue_number":65,"clue_text":"hormones (estrogen and progestin) are given to postmenopausal women; believed to protect them from heart disease and osteoporosis"},"67":{"clue_number":67,"clue_text":"an edge tool with a heavy bladed head mounted across a handle"},"68":{"clue_number":68,"clue_text":"the younger of the two _____ brothers remembered best for their fairy stories (1786-1859)"},"70":{"clue_number":70,"clue_text":"act as a _________er in a sports event"},"73":{"clue_number":73,"clue_text":"infections of the skin or nails caused by fungi and appearing as itching circular patches"},"74":{"clue_number":74,"clue_text":"English philologist who first proposed the Oxford English Dictionary (1825-1910)"},"75":{"clue_number":75,"clue_text":"apprehended with certainty"},"76":{"clue_number":76,"clue_text":"the state of being certain"}},"Down":{"1":{"clue_number":1,"clue_text":"at right angles to the length of a ship or airplane"},"2":{"clue_number":2,"clue_text":"wingless insect with mouth parts adapted for biting; mostly parasitic on birds"},"3":{"clue_number":3,"clue_text":"a lightweight triangular scarf worn by a woman"},"4":{"clue_number":4,"clue_text":"with difficulty or inconvenience; scarcely or hardly"},"5":{"clue_number":5,"clue_text":"a city in the western Netherlands; residence of the Pilgrim Fathers for 11 years before they sailed for America in 1620"},"6":{"clue_number":6,"clue_text":"either of two distinct works in Old Icelandic dating from the late 13th century and consisting of 34 mythological and heroic ballads composed between 800 and 1200; the primary source for Scandinavian mythology"},"7":{"clue_number":7,"clue_text":"Scottish philosopher of common sense who opposed the ideas of David Hume (1710-1796)"},"8":{"clue_number":8,"clue_text":"one of the most common of the five major classes of immunoglobulins; the chief antibody in the membranes of the gastrointestinal and respiratory tracts"},"9":{"clue_number":9,"clue_text":"(Sanskrit) Hindu god of fire in ancient and traditional India; one of the three chief deities of the Vedas"},"10":{"clue_number":10,"clue_text":"a shape that sags"},"11":{"clue_number":11,"clue_text":"300 to 3000 megahertz"},"12":{"clue_number":12,"clue_text":"gather, as of natural products"},"13":{"clue_number":13,"clue_text":"(anatomy) a fold or wrinkle or crease"},"14":{"clue_number":14,"clue_text":"a primeval Egyptian personification of air and breath; worshipped especially at Thebes"},"22":{"clue_number":22,"clue_text":"a drug used as an anesthetic by veterinarians; illicitly taken (originally in the form of powder or `dust') for its effects as a hallucinogen"},"25":{"clue_number":25,"clue_text":"(Roman mythology) ancient Roman god; personification of the sun; counterpart of Greek Helios"},"27":{"clue_number":27,"clue_text":"fringe-toed lizard"},"29":{"clue_number":29,"clue_text":"being nine more than eighty"},"30":{"clue_number":30,"clue_text":"a shoe carved from a single block of wood"},"31":{"clue_number":31,"clue_text":"a town in north central Oklahoma"},"33":{"clue_number":33,"clue_text":"Roman poet remembered for his elegiac verses on love (43 BC - AD 17)"},"34":{"clue_number":34,"clue_text":"look at carefully; study mentally"},"35":{"clue_number":35,"clue_text":"flow in a circular current, of liquids"},"36":{"clue_number":36,"clue_text":"a fee charged for exchanging currencies"},"37":{"clue_number":37,"clue_text":"breath"},"38":{"clue_number":38,"clue_text":"look at with amorous intentions"},"40":{"clue_number":40,"clue_text":"the 9th letter of the Greek alphabet"},"44":{"clue_number":44,"clue_text":"hormone secreted by the posterior pituitary gland (trade name Pitressin) and also by nerve endings in the hypothalamus; affects blood pressure by stimulating capillary muscles and reduces urine flow by affecting reabsorption of water by kidney tubules"},"47":{"clue_number":47,"clue_text":"someone who engages in ___itrage (who purchases securities in one market for immediate resale in another in the hope of profiting from the price differential)"},"49":{"clue_number":49,"clue_text":"automatic data processing by electronic means without the use of tabulating cards or punched tapes"},"51":{"clue_number":51,"clue_text":"deprive of by deceit"},"53":{"clue_number":53,"clue_text":"aquatic South American rodent resembling a small beaver; bred for its fur"},"55":{"clue_number":55,"clue_text":"Swedish oceanographer who recognized the role of the Coriolis effect on ocean currents (1874-1954)"},"57":{"clue_number":57,"clue_text":"(ancient Greece) a hymn of praise (especially one sung in ancient Greece to invoke or thank a deity)"},"58":{"clue_number":58,"clue_text":"heighten or intensify"},"59":{"clue_number":59,"clue_text":"displaying a red color"},"60":{"clue_number":60,"clue_text":"a terrorist group that is the remnants of the original Bolivian insurgents trained by Che Guevara; attacks small unprotected targets such as power pylons or oil pipelines or government buildings"},"61":{"clue_number":61,"clue_text":"an early name of Ireland that is now used in poetry"},"62":{"clue_number":62,"clue_text":"a floor covering"},"64":{"clue_number":64,"clue_text":"a fluorocarbon that is replacing chlorofluorocarbon as a refrigerant and propellant in aerosol cans; considered to be somewhat less destructive to the atmosphere"},"65":{"clue_number":65,"clue_text":"a German courtesy title or form of address for a man"},"66":{"clue_number":66,"clue_text":"the act of rending or ripping or splitting something"},"69":{"clue_number":69,"clue_text":"utter a high-pitched cry, as of seagulls"},"71":{"clue_number":71,"clue_text":"take on color or become colored"},"72":{"clue_number":72,"clue_text":"being six more than fifty"}}},"words":{"across":{"1":"alfileria","10":"durra","15":"boiledegg","16":"rheum","17":"euclidian","18":"ofage","19":"ash","20":"dad","21":"ipo","23":"pan","24":"meuse","26":"cpu","28":"oni","30":"sep","32":"move","36":"awol","39":"xian","41":"avid","42":"gig","43":"cobia","45":"ied","46":"inla","48":"todd","49":"edwy","50":"oder","51":"gat","52":"hnd","54":"bey","56":"upper","60":"eel","63":"kph","65":"hrt","67":"axe","68":"grimm","70":"cheerlead","73":"tinea","74":"furnivall","75":"known","76":"certainty"},"down":{"1":"abeam","2":"louse","3":"fichu","4":"ill","5":"leiden","6":"edda","7":"reid","8":"iga","9":"agni","10":"droop","11":"uhf","12":"reap","13":"ruga","14":"amen","22":"pcp","25":"sol","27":"uma","29":"ixc","30":"sabot","31":"enid","33":"ovid","34":"view","35":"eddy","36":"agio","37":"wind","38":"ogle","40":"iota","44":"adh","47":"arb","49":"edp","51":"gyp","53":"nutria","55":"ekman","57":"paean","58":"exalt","59":"redly","60":"egtk","61":"erin","62":"lino","64":"hcfc","65":"herr","66":"rent","69":"mew","71":"hue","72":"lvi"}},"cells":"alfileria#durraboiledegg#rheumeuclidian#ofageash#dad#ipo#panmeuse####cpu######oni#sep#moveawol#xian##avidgig##cobia##iedinla##todd#edwyoder#gat#hnd######bey####uppereel#kph#hrt#axegrimm#cheerleadtinea#furnivallknown#certainty","grid":{},"is_random":true};
    
}(module));

},{}],13:[function(require,module,exports){
/*global React, module, require */

(function (React, module) {
    var DIRECTIONS = require('./Directions.js'),
        UNPLAYABLE = require('./Unplayable.js'),
        model = function (cells, size, rawData) {
            this.cells = cells,
            this.size = size;
            this.rawData = rawData;
            this.lookupTable = this.buildLookupTable();
        };
    
    function range(start, stop, step){
        if (typeof stop=='undefined'){
            // one param defined
            stop = start;
            start = 0;
        };
        if (typeof step=='undefined'){
            step = 1;
        };
        if ((step>0 && start>=stop) || (step<0 && start<=stop)){
            return [];
        };
        var result = [];
        for (var i=start; step>0 ? i < stop : i > stop; i+=step){
            result.push(i);
        };
        return result;
    };

    model.prototype = {

        buildLookupTable: function() {
            
            var acrossKey = DIRECTIONS.ACROSS,
                downKey = DIRECTIONS.DOWN,
                result = {},
                numberedCells = Object.keys(this.rawData.numbered);

            result.numberToCell = {};
            for (var i = 1, l = numberedCells.length; i <= l; i++) {
                result.numberToCell[i] = numberedCells[i - 1];
            }
            return result;
        },
        
        wordAt: function(position, direction) {
            var cells = [], result = [], start, end;
            if (direction == DIRECTIONS.ACROSS) {
                start = Math.floor(position / this.size) * this.size;
                end = start + this.size;
                cells = range(start, end);
            } else {
                start = position % this.size;
                end = this.cells.length;
                cells = range(start, end, this.size);
            }
            var cellIndex = cells.indexOf(position),
                left = [],
                right = [],
                i;
            for (i = cellIndex; i < cells.length; i++) {
                if (this.cells[cells[i]] !== '#') {
                    right.push(cells[i]);
                } else {
                    break;
                }
            }
            for (i = cellIndex; i >= 0; i--) {
                if (this.cells[cells[i]] !== '#') {
                    left.push(cells[i]);
                } else {
                    break;
                }
            }
            return left.concat(right);
        }

    };

    module.exports = model;
}(React, module));

},{"./Directions.js":14,"./Unplayable.js":15}],14:[function(require,module,exports){
(function(module) {
    module.exports = {
        ACROSS: [1, 0],
        DOWN: [0, 1]
    };
}(module));

},{}],15:[function(require,module,exports){
(function(module) {
    module.exports = '#';
}(module));

},{}],16:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],17:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.once = noop;
process.off = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],18:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function (condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error('Invariant Violation: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;
}).call(this,require("/home/adam/projects/cruci/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/home/adam/projects/cruci/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":17}],19:[function(require,module,exports){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher');

},{"./lib/Dispatcher":20}],20:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * 
 * @preventMunge
 */

'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var invariant = require('fbjs/lib/invariant');

var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *   CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *         case 'city-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

var Dispatcher = (function () {
  function Dispatcher() {
    _classCallCheck(this, Dispatcher);

    this._callbacks = {};
    this._isDispatching = false;
    this._isHandled = {};
    this._isPending = {};
    this._lastID = 1;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   */

  Dispatcher.prototype.register = function register(callback) {
    var id = _prefix + this._lastID++;
    this._callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   */

  Dispatcher.prototype.unregister = function unregister(id) {
    !this._callbacks[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.unregister(...): `%s` does not map to a registered callback.', id) : invariant(false) : undefined;
    delete this._callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   */

  Dispatcher.prototype.waitFor = function waitFor(ids) {
    !this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Must be invoked while dispatching.') : invariant(false) : undefined;
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this._isPending[id]) {
        !this._isHandled[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Circular dependency detected while ' + 'waiting for `%s`.', id) : invariant(false) : undefined;
        continue;
      }
      !this._callbacks[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): `%s` does not map to a registered callback.', id) : invariant(false) : undefined;
      this._invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   */

  Dispatcher.prototype.dispatch = function dispatch(payload) {
    !!this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.') : invariant(false) : undefined;
    this._startDispatching(payload);
    try {
      for (var id in this._callbacks) {
        if (this._isPending[id]) {
          continue;
        }
        this._invokeCallback(id);
      }
    } finally {
      this._stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   */

  Dispatcher.prototype.isDispatching = function isDispatching() {
    return this._isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @internal
   */

  Dispatcher.prototype._invokeCallback = function _invokeCallback(id) {
    this._isPending[id] = true;
    this._callbacks[id](this._pendingPayload);
    this._isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @internal
   */

  Dispatcher.prototype._startDispatching = function _startDispatching(payload) {
    for (var id in this._callbacks) {
      this._isPending[id] = false;
      this._isHandled[id] = false;
    }
    this._pendingPayload = payload;
    this._isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */

  Dispatcher.prototype._stopDispatching = function _stopDispatching() {
    delete this._pendingPayload;
    this._isDispatching = false;
  };

  return Dispatcher;
})();

module.exports = Dispatcher;
}).call(this,require("/home/adam/projects/cruci/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/home/adam/projects/cruci/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":17,"fbjs/lib/invariant":18}],21:[function(require,module,exports){
/* eslint-disable no-unused-vars */
'use strict';
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}]},{},[5])