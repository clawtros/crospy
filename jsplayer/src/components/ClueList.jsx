import React from 'react';
import classNames from 'classnames';
import $ from 'jquery';
import ReactDOM from 'react-dom';
import CrosswordStore from '../CrosswordStore';
var entities = require('entities');

export default React.createClass({
  handleClick: function(clueId) {
    this.props.handleClueClick(clueId, this.props.directionEnum);
  },

  componentDidUpdate: function() {
    var node = ReactDOM.findDOMNode(this),
        container = $(node).find('.clue-list-container'),
        activeClue = container.find('.active-clue');

    if (activeClue.length > 0) {
      var newTop = activeClue.offset().top - container.offset().top - container.height() / 2 + activeClue.height() / 2;
      container.stop();
      container.animate({'scrollTop': container.scrollTop() + newTop}, 125);
    }
  },
  
  render: function () {
    var activeClue = this.props.activeClue,
        templated = Object.keys(this.props.clues).map(function(clueId) {
          var clue = this.props.clues[clueId],
              classes = classNames({
                'clue-container': true,
                'active-direction': this.props.isActive,
                'active-clue': parseInt(clueId) === activeClue
              }),
              word = this.props.model.wordAt(
                this.props.model.lookupTable.numberToCell[clueId] - 1,
                this.props.directionEnum
              ),
              entered = word.map((n) => this.props.cellValues[n] || '_'),
              enteredLetters = entered.filter((l) => l != '_'),
              showEntered = enteredLetters.length > 0,
              strikeThrough = enteredLetters.length == word.length,
              phraseStyle = {
                textDecoration: strikeThrough ? 'line-through' : 'none'
              };

          return (
            <li className={classes} onClick={this.handleClick.bind(this, clueId, this.props.directionEnum)} key={this.props.direction + "_" + clueId}>
              <div className="clue-phrase" style={ phraseStyle }>
                <div className="clue-number">{clue.clue_number}</div>
                {entities.decodeHTML(clue.clue_text)} <span className="entered">{ showEntered ? '['+entered.join("")+']' : ''}</span>
              </div>
            </li>
          )
        }, this);
    
    return <div className="clues ">
              <h2 className="clue-list-header">{this.props.direction}</h2>
              <div className="clue-list-container">
                <ul className="clue-list" >
                  {templated}
                </ul>
              </div>
    </div>
  }
});
