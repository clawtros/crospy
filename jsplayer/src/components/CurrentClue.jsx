import React from 'react';

var DIRECTIONS = require('../models/Directions.js');

export default React.createClass({
  render: function() {
    return (
      <h3 className="current-clue">{this.props.clue.clue_number}{this.props.direction == DIRECTIONS.ACROSS ? 'A' : 'D'} <span className="current-clue-text">{this.props.clue.clue_text}</span></h3>
    );
  }
});
