import React from 'react';
import classNames from 'classnames';

export default React.createClass({
    rows: [
      "qwertyuiop",
      "asdfghjkl",
      "zxcvbnm"
    ],
    
    render: function() {
      var classes = classNames({
        onscreen: this.props.show === true,
        keyboard: true
      });
      return (
        <div className={classes}>
        <div className="keyboard-contents">
        {this.rows.map(function(row) {
            return (
              <div key={row} className="keyboard-row">
              {row.split("").map(function(letter) {
                return <div className={"keyboard-key keyboard-letter"} key={letter}
                            onClick={this.props.keyHandler.bind(null, letter)}>{letter}</div>
              }, this)}
              
              </div>
              )
        }, this)}
        <div className={"keyboard-key keyboard-backspace"} onClick={this.props.backspaceHandler}>&larr;</div>
        <div className={"keyboard-key keyboard-close"} onClick={this.props.closeHandler}>CLOSE</div>
        <div className={"keyboard-key keyboard-next"} onClick={this.props.nextHandler.bind(null, 1)}>&rarr;</div>
        <div className={"keyboard-key keyboard-direction"} onClick={this.props.directionHandler}>A/D</div>
        </div>
        </div>
      )
    }
  });
