import React from 'react';
import classNames from 'classnames';
import $ from 'jquery';
import ReactDOM from 'react-dom';
import CrosswordStore from '../CrosswordStore';

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
      container.scrollTop(container.scrollTop() + newTop);
    }
  },
  
  render: function () {
    var activeClue = this.props.activeClue,
        templated = Object.keys(this.props.clues).map(function(clueId) {
          var clue = this.props.clues[clueId],
              classes = classNames({
                'clue-container': true,
                'active-clue': parseInt(clueId) === activeClue
              }),
              entered = this.props.model.wordAt(
                this.props.model.lookupTable.numberToCell[clueId] - 1,
                this.props.directionEnum
              ).map((n) => this.props.cellValues[n] || '_').join(" ");

          return (
            <li className={classes}  onClick={this.handleClick.bind(this, clueId, this.props.directionEnum)} key={this.props.direction + "_" + clueId}>
              <div className="clue-phrase">
                <div className="clue-number">{clue.clue_number}</div>
                {clue.clue_text} [ {entered} ]
              </div>
            </li>
          )
        }, this);
    
    return <div>
              <h2 className="clue-list-header">{this.props.direction}</h2>
              <div className="clue-list-container">
                <ul className="clue-list" >
                  {templated}
                </ul>
              </div>
    </div>
  }
});
