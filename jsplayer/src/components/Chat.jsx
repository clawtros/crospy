import React from 'react';
import AppConstants from '../app-constants';
import CrosswordStore from '../CrosswordStore';

export default React.createClass({
  getInitialState: function() {
    return {
      roster: []
    }
  },
  handleRosterUpdate: function(newRoster) {
    this.setState({roster: newRoster});    
  },
  componentWillMount: function() {
    CrosswordStore.addEventListener(AppConstants.ROSTER_UPDATE, this.handleRosterUpdate);
  },
  render: function() {
    return <div className="chatbox">{this.state.roster.length} connected</div>;
  }
})
