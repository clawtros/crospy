/*global React, module, require */

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
    
    var result = {},
        numberedCells = Object.keys(this.rawData.numbered);

    result.numberToCell = {};
    for (var i = 1, l = numberedCells.length; i <= l; i++) {
      result.numberToCell[i] = numberedCells[i - 1];
    }
    return result;
  },
  
  wordAt: function(position, direction) {
    var cells = [], start, end;
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
