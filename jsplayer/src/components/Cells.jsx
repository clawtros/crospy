import React from 'react';
import Keyboard from './Keyboard.jsx';
import Cell from './Cell.jsx';
import Actions from '../app-actions';
import CrosswordStore from '../CrosswordStore';
import DIRECTIONS from '../models/Directions.js';
import UNPLAYABLE from '../models/Unplayable.js';


export default React.createClass({
  getInitialState: function() {
    return {
      direction: DIRECTIONS.ACROSS,
      cellValues: CrosswordStore.getValues(this.props.crosswordId)
    }
  },

  handleChange: function (changeEvent) {
    var values = this.state.cellValues;
    values[changeEvent.cellId] = changeEvent.character;
    this.setState({cellValues: values});
  },
  
  componentWillMount: function() {
    CrosswordStore.addChangeListener(this.handleChange);
  },
  
  makeActive: function(id) {
    if (this.props.values[id] !== UNPLAYABLE) {
      this.props.makeActive(id);
    }
  },

  handleLetter: function(character) {
    var nextCell = this.nextCellFrom(this.props.activeCell, 1, this.props.direction);
    Actions.keyEntered(this.props.activeCell, character, this.props.crosswordId);
    this.go(1);
  },

  handleBackspace: function() {
    if (this.state.cellValues[this.props.activeCell] == undefined) {
      this.go(-1);
      Actions.keyEntered(this.props.activeCell, undefined, this.props.crosswordId);
    } else {
      Actions.keyEntered(this.props.activeCell, undefined, this.props.crosswordId);
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
      <div>
        <Keyboard show={this.props.showKeyboard}
                  nextHandler={this.props.skipWord}
                  directionHandler={this.toggleDirection}
                  closeHandler={this.closeKeyboard}
                  backspaceHandler={this.handleBackspace}
                  keyHandler={this.handleLetter}/>
        <div className="cell-list">
          {this.props.values.split("").map(function(cell, id) {
             return (
               <Cell onClick={this.makeActive.bind(this, id)}
                     number={numbers[id + 1]}
                     reveal={this.props.revealEverything}
                     focused={highlightedCells.indexOf(id) > -1}
                     selected={id == this.props.activeCell}
                     highlightErrors={this.props.highlightErrors}
                     key={id}
                     value={this.state.cellValues[id]}
                     playable={cell !== UNPLAYABLE}
                     correctValue={cell}
                     size={100 / size} />);
           }, this)}
               
               <div className="clearfix"></div>
        </div>
      </div>
    );
  }
});
