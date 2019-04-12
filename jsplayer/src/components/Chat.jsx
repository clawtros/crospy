import React from 'react';
import AppConstants from '../app-constants';
import CrosswordStore from '../CrosswordStore';
import ChatMessage from './ChatMessage.jsx';

export default React.createClass({
  getInitialState: function() {
    return {
      messages: [],
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
    return <div className="chatbox">
      <div>
        {this.state.messages.map((message) => <ChatMessage user={message.user} message={message.content}/>)}
        {this.state.roster.length} connected
      </div>
    </div>;
  }
})
