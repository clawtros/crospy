import React from 'react';
var entities = require('entities');
var DIRECTIONS = require('../models/Directions.js');

export default (props) => {
    return (
      <h3 className="current-clue">
        {props.clue.clue_number}{props.direction == DIRECTIONS.ACROSS ? 'A' : 'D'}
        &nbsp;
        <span className="current-clue-text">{entities.decodeHTML(props.clue.clue_text)}</span>
      </h3>
    );
}
