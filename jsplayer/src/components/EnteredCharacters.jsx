import React from 'react';

export default (props) => {
  var entered = props.word.map((n) => props.cellValues[n] || '_'),
      enteredLetters = entered.filter((l) => l != '_'),
      showEntered = enteredLetters.length > 0;
  
  return (
    <span className="entered">{ showEntered ? '['+entered.join("")+']' : ''}</span>
  );
}
