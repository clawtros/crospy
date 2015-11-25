import React from 'react';
import Cells from './Cells.jsx';
import ClueList from './ClueList.jsx';
import CurrentClue from './CurrentClue.jsx';
import CrosswordModel from '../models/CrosswordModel.js';
import Actions from '../app-actions';
import DIRECTIONS from '../models/Directions.js';
import UNPLAYABLE from '../models/Unplayable.js';
import Chat from './Chat.jsx';
import CrosswordStore from '../CrosswordStore';

export default React.createClass({

  getInitialState: function() {
    return {
      showKeyboard: false,
      revealEverything: false,
      highlightErrors: false,
      activeCell: undefined,
      direction: DIRECTIONS.ACROSS,
      cellValues: [],
      cellSources: []

    };
  },

  handleChange: function (changeEvent) {
    var values = this.state.cellValues,
        sources = this.state.cellSources
    values[changeEvent.cellId] = changeEvent.character;
    sources[changeEvent.cellId] = changeEvent.source;
    this.setState({
      cellValues: values,
      cellSources: sources
    });
  },
  
  componentWillMount: function() {
    CrosswordStore.addChangeListener(this.handleChange);
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
      <div>
        <Chat crosswordId={this.props.crosswordId} />
        <div className="row">
          <div className="col-xs-12">
            {this.state.activeCell !== undefined ? 
             <CurrentClue direction={this.state.direction}
                          clue={this.getClue(this.getCurrentClueNumber(), this.state.direction)}
             />
             : <h3 className="current-clue">Random {this.props.size} x {this.props.size} Crossword</h3> }
             
          </div>
        </div>
        <div className="row">
          <div className="col-md-8">
            <Cells numbered={this.props.numbered}
                   playerId={this.props.playerId}
                   cellValues={this.state.cellValues}
                   cellSources={this.state.cellSources}
                   highlightedCells={this.props.model.wordAt(this.state.activeCell, this.state.direction)}
                   highlightErrors={this.state.highlightErrors}
                   revealEverything={this.state.revealEverything}
                   makeActive={this.handleMakeActive}
                   activeCell={this.state.activeCell}
                   direction={this.state.direction}
                   crosswordId={this.props.crosswordId}
                   skipWord={this.handleSkipWord}
                   showKeyboard={this.state.showKeyboard}
                   closeKeyboard={this.closeKeyboard}
                   toggleDirection={this.toggleDirection}
                   values={this.props.cells}
                   size={this.props.size}/>
            <label>
              <input type="checkbox" onChange={this.toggleHighlightErrors} checked={this.state.highlightErrors}/> Show Errors
            </label>
            <label className="keyboard-label">
              <input type="checkbox" onChange={this.toggleKeyboard} checked={this.state.showKeyboard}/> Show Keyboard
            </label>

            <a href="/">New</a>
          </div>
          <div className="col-md-4">
            <div className="row">
              <div className={"col-xs-6 col-md-12"}>
                <ClueList direction="Across"
                          directionEnum={DIRECTIONS.ACROSS}
                          activeClue={this.state.activeAcrossClue}
                          clues={this.props.clues.Across}
                          handleClueClick={this.handleClueClick}/>
              </div>
              <div className={"col-xs-6 col-md-12"}>
                <ClueList direction="Down"
                          directionEnum={DIRECTIONS.DOWN}
                          activeClue={this.state.activeDownClue}
                          clues={this.props.clues.Down}
                          handleClueClick={this.handleClueClick}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});
