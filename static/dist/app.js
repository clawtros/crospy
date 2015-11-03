(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*global React, _, require, clearInterval, setInterval, $ */

(function(React, _) {
  var Crossword = require('./components/Crossword.jsx'),
      CrosswordModel = require('./models/CrosswordModel.js'),
      numloadingcells = 400,
      data = require('./data.js'),
      getRemotely = true,
      testLoading = true,
      makeLoader = function() {
          var container = $('#loading_container'),
              interval;
          for (var i = 0; i < numloadingcells; i++) {
              container.append('<div class="foo"></div>');
          }
          
          function randomlyFlip() {
              var targetIndex = parseInt(Math.random() * numloadingcells / 2),
                  target = $($('.foo')[targetIndex]),
                  oppositeTarget = $($('.foo')[numloadingcells - targetIndex]);
              target.toggleClass('highlighted');
              oppositeTarget.toggleClass('highlighted');
          }
          
          return setInterval(randomlyFlip, 100);
      };

  if (!getRemotely) {
      document.onready = function() {
          var model = new CrosswordModel(data.cells, data.gridinfo.size, data);
          React.render(React.createElement(Crossword, {model: model, rawData: data, title: data.gridinfo.name, clues: data.clues, numbered: data.numbered, cells: data.cells, size: data.gridinfo.size}), document.getElementById('app'));
          $('.loading').addClass('out');
          $('#app').removeClass('out');
      };
      
  } else {
      
      document.onready = function() {
          var interval = makeLoader();
          $.ajax({
              url: "/api/random/",
              datatype: "json",
              success: function(result) {
                  var data = JSON.parse(result);
                  var model = new CrosswordModel(data.cells, data.gridinfo.size, data);
                  React.render(React.createElement(Crossword, {model: model, rawData: data, title: data.gridinfo.name, clues: data.clues, numbered: data.numbered, cells: data.cells, size: data.gridinfo.size}), document.getElementById('app'));
                  $('.loading').addClass('out');
                  $('#app').removeClass('out');
                  clearInterval(interval);
              },
              error: function() {
                  alert('kaboom');
                  $('.loading').addClass('out');
                  $('#app').removeClass('out');
                  clearInterval(interval);
              }
          });
      };
  }

}(React, _));

},{"./components/Crossword.jsx":5,"./data.js":8,"./models/CrosswordModel.js":9}],2:[function(require,module,exports){
(function(React, module, undefined) {
  module.exports = React.createClass({displayName: "exports",
    render: function() {
      var fontSize = this.props.size * 0.35,
          style = {
            width: this.props.size + "%",
            fontSize: fontSize + 'vmin',
            paddingTop: this.props.size + "%"
          },
          numStyle = {
            fontSize: this.props.size + 'pt'
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
          React.createElement("div", {style: numStyle, className: "cell-number"}, this.props.number), 
          React.createElement("div", {onClick: this.props.onClick, 
               className: "cell-content flex-centered"}, 
            this.props.playable ? (this.props.reveal ? this.props.correctValue : this.props.value) : ""
          )
        )
      );
    }
  });
}(React, module));

},{}],3:[function(require,module,exports){
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

},{"../models/Directions.js":10,"./Cell.jsx":2,"./Keyboard.jsx":7}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
(function(React, module, undefined) {
  var Cells = require('./Cells.jsx'),
      ClueList = require('./ClueList.jsx'),
      CurrentClue = require('./CurrentClue.jsx'),
      CrosswordModel = require('../models/CrosswordModel.js'),
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

    handleSkipWord: function(delta) {
      var currentWordNumber = this.getWordNumber(this.state.activeCell, this.state.direction),
          l = this.getClueNumbers(this.state.direction),
          d = delta || 1,
          index = l.indexOf(currentWordNumber) + d,
          // TODO: remove this monstrosity
          target = l[index < 0 ? l.length - 1 : (index >= l.length ? l.length - index : index)];
      console.log(index, target, this.state.activeCell, this.state.direction);
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

    handleClueClick: function(clueId, direction) {
      this.state.direction = direction;
      this.handleMakeActive(this.props.model.lookupTable.numberToCell[clueId] - 1);
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

},{"../models/CrosswordModel.js":9,"../models/Directions.js":10,"./Cells.jsx":3,"./ClueList.jsx":4,"./CurrentClue.jsx":6}],6:[function(require,module,exports){
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
},{"../models/Directions.js":10}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
(function(module) {
    module.exports = {"numbered":{"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"11":11,"12":11,"13":45,"14":46,"15":47,"16":16,"26":21,"31":30,"41":35,"46":38,"50":41,"54":44,"55":53,"58":47,"61":52,"64":56,"70":55,"72":62,"79":58,"81":70,"83":107,"84":95,"87":65,"88":86,"89":87,"90":88,"91":89,"92":90,"93":91,"96":73,"97":106,"102":77,"106":80,"111":85,"115":108,"118":88,"121":92,"124":111,"127":96,"132":115,"136":104,"141":123,"145":110,"146":168,"154":113,"155":149,"161":118,"163":156,"164":157,"165":158,"166":159,"167":160,"168":161,"170":124,"172":164,"174":166,"175":167,"178":130,"181":135,"184":162,"187":144,"188":165,"192":169,"196":149,"202":158,"211":163,"217":172},"gridinfo":{"size":15,"name":"Randomly Generated Crossword","randid":59822},"clues":{"Across":{"1":{"clue_number":1,"clue_text":"European weed naturalized in southwestern United States and Mexico having reddish decumbent stems with small fernlike leaves and small deep reddish-lavender flowers followed by slender fruits that stick straight up; often grown for forage"},"10":{"clue_number":10,"clue_text":"sorghums of dry regions of Asia and North Africa"},"15":{"clue_number":15,"clue_text":"egg cooked briefly in the shell in gently boiling water"},"16":{"clue_number":16,"clue_text":"rhubarb"},"17":{"clue_number":17,"clue_text":"relating to geometry as developed by Euclid"},"18":{"clue_number":18,"clue_text":"having attained a specific age; (`aged' is pronounced as one syllable)"},"19":{"clue_number":19,"clue_text":"convert into ___es"},"20":{"clue_number":20,"clue_text":"an informal term for a father; probably derived from baby talk"},"21":{"clue_number":21,"clue_text":"a corporation's first offer to sell stock to the public"},"23":{"clue_number":23,"clue_text":"make a sweeping movement"},"24":{"clue_number":24,"clue_text":"an American operation in World War I (1918); American troops under Pershing drove back the German armies which were saved only by the armistice on November 11"},"26":{"clue_number":26,"clue_text":"(computer science) the part of a computer (a microprocessor chip) that does most of the data processing"},"28":{"clue_number":28,"clue_text":"the military intelligence agency that provides for the intelligence and counterintelligence and investigative and security requirements of the United States Navy"},"30":{"clue_number":30,"clue_text":"the month following August and preceding October"},"32":{"clue_number":32,"clue_text":"the act of changing your residence or place of business"},"36":{"clue_number":36,"clue_text":"absent without permission"},"39":{"clue_number":39,"clue_text":"a city of central China; capital of ancient Chinese empire 221-206 BC"},"41":{"clue_number":41,"clue_text":"(often followed by `for') ardently or excessively desirous"},"42":{"clue_number":42,"clue_text":"a cluster of hooks (without barbs) that is drawn through a school of fish to hook their bodies; used when fish are not biting"},"43":{"clue_number":43,"clue_text":"large dark-striped tropical food and game fish related to remoras; found worldwide in coastal to open waters"},"45":{"clue_number":45,"clue_text":"an explosive device that is improvised"},"46":{"clue_number":46,"clue_text":"a radical terrorist group dedicated to the removal of British forces from Northern Ireland and the unification of Ireland"},"48":{"clue_number":48,"clue_text":"Scottish chemist noted for his research into the structure of nucleic acids (born in 1907)"},"49":{"clue_number":49,"clue_text":"King of England who was renounced by Northumbria in favor of his brother Edgar (died in 959)"},"50":{"clue_number":50,"clue_text":"a European river; flows into the Baltic Sea"},"51":{"clue_number":51,"clue_text":"a gangster's pistol"},"52":{"clue_number":52,"clue_text":"a diploma given for vocational training that prepares the student for a career in a particular area; good students may progress to a course leading to a degree"},"54":{"clue_number":54,"clue_text":"(formerly) a title of respect for a man in Turkey or Egypt"},"56":{"clue_number":56,"clue_text":"superior in rank or accomplishment"},"60":{"clue_number":60,"clue_text":"voracious snakelike marine or freshwater fishes with smooth slimy usually scaleless skin and having a continuous vertical fin but no ventral fins"},"63":{"clue_number":63,"clue_text":"the ratio of the distance traveled (in kilometers) to the time spent traveling (in hours)"},"65":{"clue_number":65,"clue_text":"hormones (estrogen and progestin) are given to postmenopausal women; believed to protect them from heart disease and osteoporosis"},"67":{"clue_number":67,"clue_text":"an edge tool with a heavy bladed head mounted across a handle"},"68":{"clue_number":68,"clue_text":"the younger of the two _____ brothers remembered best for their fairy stories (1786-1859)"},"70":{"clue_number":70,"clue_text":"act as a _________er in a sports event"},"73":{"clue_number":73,"clue_text":"infections of the skin or nails caused by fungi and appearing as itching circular patches"},"74":{"clue_number":74,"clue_text":"English philologist who first proposed the Oxford English Dictionary (1825-1910)"},"75":{"clue_number":75,"clue_text":"apprehended with certainty"},"76":{"clue_number":76,"clue_text":"the state of being certain"}},"Down":{"1":{"clue_number":1,"clue_text":"at right angles to the length of a ship or airplane"},"2":{"clue_number":2,"clue_text":"wingless insect with mouth parts adapted for biting; mostly parasitic on birds"},"3":{"clue_number":3,"clue_text":"a lightweight triangular scarf worn by a woman"},"4":{"clue_number":4,"clue_text":"with difficulty or inconvenience; scarcely or hardly"},"5":{"clue_number":5,"clue_text":"a city in the western Netherlands; residence of the Pilgrim Fathers for 11 years before they sailed for America in 1620"},"6":{"clue_number":6,"clue_text":"either of two distinct works in Old Icelandic dating from the late 13th century and consisting of 34 mythological and heroic ballads composed between 800 and 1200; the primary source for Scandinavian mythology"},"7":{"clue_number":7,"clue_text":"Scottish philosopher of common sense who opposed the ideas of David Hume (1710-1796)"},"8":{"clue_number":8,"clue_text":"one of the most common of the five major classes of immunoglobulins; the chief antibody in the membranes of the gastrointestinal and respiratory tracts"},"9":{"clue_number":9,"clue_text":"(Sanskrit) Hindu god of fire in ancient and traditional India; one of the three chief deities of the Vedas"},"10":{"clue_number":10,"clue_text":"a shape that sags"},"11":{"clue_number":11,"clue_text":"300 to 3000 megahertz"},"12":{"clue_number":12,"clue_text":"gather, as of natural products"},"13":{"clue_number":13,"clue_text":"(anatomy) a fold or wrinkle or crease"},"14":{"clue_number":14,"clue_text":"a primeval Egyptian personification of air and breath; worshipped especially at Thebes"},"22":{"clue_number":22,"clue_text":"a drug used as an anesthetic by veterinarians; illicitly taken (originally in the form of powder or `dust') for its effects as a hallucinogen"},"25":{"clue_number":25,"clue_text":"(Roman mythology) ancient Roman god; personification of the sun; counterpart of Greek Helios"},"27":{"clue_number":27,"clue_text":"fringe-toed lizard"},"29":{"clue_number":29,"clue_text":"being nine more than eighty"},"30":{"clue_number":30,"clue_text":"a shoe carved from a single block of wood"},"31":{"clue_number":31,"clue_text":"a town in north central Oklahoma"},"33":{"clue_number":33,"clue_text":"Roman poet remembered for his elegiac verses on love (43 BC - AD 17)"},"34":{"clue_number":34,"clue_text":"look at carefully; study mentally"},"35":{"clue_number":35,"clue_text":"flow in a circular current, of liquids"},"36":{"clue_number":36,"clue_text":"a fee charged for exchanging currencies"},"37":{"clue_number":37,"clue_text":"breath"},"38":{"clue_number":38,"clue_text":"look at with amorous intentions"},"40":{"clue_number":40,"clue_text":"the 9th letter of the Greek alphabet"},"44":{"clue_number":44,"clue_text":"hormone secreted by the posterior pituitary gland (trade name Pitressin) and also by nerve endings in the hypothalamus; affects blood pressure by stimulating capillary muscles and reduces urine flow by affecting reabsorption of water by kidney tubules"},"47":{"clue_number":47,"clue_text":"someone who engages in ___itrage (who purchases securities in one market for immediate resale in another in the hope of profiting from the price differential)"},"49":{"clue_number":49,"clue_text":"automatic data processing by electronic means without the use of tabulating cards or punched tapes"},"51":{"clue_number":51,"clue_text":"deprive of by deceit"},"53":{"clue_number":53,"clue_text":"aquatic South American rodent resembling a small beaver; bred for its fur"},"55":{"clue_number":55,"clue_text":"Swedish oceanographer who recognized the role of the Coriolis effect on ocean currents (1874-1954)"},"57":{"clue_number":57,"clue_text":"(ancient Greece) a hymn of praise (especially one sung in ancient Greece to invoke or thank a deity)"},"58":{"clue_number":58,"clue_text":"heighten or intensify"},"59":{"clue_number":59,"clue_text":"displaying a red color"},"60":{"clue_number":60,"clue_text":"a terrorist group that is the remnants of the original Bolivian insurgents trained by Che Guevara; attacks small unprotected targets such as power pylons or oil pipelines or government buildings"},"61":{"clue_number":61,"clue_text":"an early name of Ireland that is now used in poetry"},"62":{"clue_number":62,"clue_text":"a floor covering"},"64":{"clue_number":64,"clue_text":"a fluorocarbon that is replacing chlorofluorocarbon as a refrigerant and propellant in aerosol cans; considered to be somewhat less destructive to the atmosphere"},"65":{"clue_number":65,"clue_text":"a German courtesy title or form of address for a man"},"66":{"clue_number":66,"clue_text":"the act of rending or ripping or splitting something"},"69":{"clue_number":69,"clue_text":"utter a high-pitched cry, as of seagulls"},"71":{"clue_number":71,"clue_text":"take on color or become colored"},"72":{"clue_number":72,"clue_text":"being six more than fifty"}}},"words":{"across":{"1":"alfileria","10":"durra","15":"boiledegg","16":"rheum","17":"euclidian","18":"ofage","19":"ash","20":"dad","21":"ipo","23":"pan","24":"meuse","26":"cpu","28":"oni","30":"sep","32":"move","36":"awol","39":"xian","41":"avid","42":"gig","43":"cobia","45":"ied","46":"inla","48":"todd","49":"edwy","50":"oder","51":"gat","52":"hnd","54":"bey","56":"upper","60":"eel","63":"kph","65":"hrt","67":"axe","68":"grimm","70":"cheerlead","73":"tinea","74":"furnivall","75":"known","76":"certainty"},"down":{"1":"abeam","2":"louse","3":"fichu","4":"ill","5":"leiden","6":"edda","7":"reid","8":"iga","9":"agni","10":"droop","11":"uhf","12":"reap","13":"ruga","14":"amen","22":"pcp","25":"sol","27":"uma","29":"ixc","30":"sabot","31":"enid","33":"ovid","34":"view","35":"eddy","36":"agio","37":"wind","38":"ogle","40":"iota","44":"adh","47":"arb","49":"edp","51":"gyp","53":"nutria","55":"ekman","57":"paean","58":"exalt","59":"redly","60":"egtk","61":"erin","62":"lino","64":"hcfc","65":"herr","66":"rent","69":"mew","71":"hue","72":"lvi"}},"cells":"alfileria#durraboiledegg#rheumeuclidian#ofageash#dad#ipo#panmeuse####cpu######oni#sep#moveawol#xian##avidgig##cobia##iedinla##todd#edwyoder#gat#hnd######bey####uppereel#kph#hrt#axegrimm#cheerleadtinea#furnivallknown#certainty","grid":{},"is_random":true};
    
}(module));

},{}],9:[function(require,module,exports){
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

},{"./Directions.js":10,"./Unplayable.js":11}],10:[function(require,module,exports){
(function(module) {
    module.exports = {
        ACROSS: [1, 0],
        DOWN: [0, 1]
    };
}(module));

},{}],11:[function(require,module,exports){
(function(module) {
    module.exports = '#';
}(module));

},{}]},{},[1])