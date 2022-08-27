import { Component, h } from 'preact'
import { ChatInput } from './ChatInput.js'
import { ChatMessages } from './ChatMessages.js';
import { ImageModal } from './ImageModal.js';

export class Chat extends Component {
    constructor() {
        super();
        this.state = {
            historyMode: false,
            imageModal: false,
            editTarget: null,
            editContent: ""
        }
    }

    render({state}) {
        var roomId = state.roomId;
        if(roomId == null || roomId == "default") {
            roomId = "";
        }
        return <div id="chat">
            {this.state.imageModal && <ImageModal type={this.state.type} href={this.state.href} setChatState={this.setState.bind(this)}/>}
            {this.state.historyMode && <div class="history-mode-indicator">Old messages</div>}
            <ChatMessages sendMessage={this.props.sendMessage} historyMode={this.state.historyMode} 
                chatMessages={this.props.state.chatMessages} session={this.props.state.session} 
                newMessage={this.props.state.newMessage} setChatState={this.setState.bind(this)}
                forceChatScroll={this.props.state.forceChatScroll} updateRoomState={this.props.updateRoomState}/>
            <ChatInput sendMessage={this.props.sendMessage} historyMode={this.state.historyMode} editContent={this.state.editContent} editTarget={this.state.editTarget} setChatState={this.setState.bind(this)}/>
        </div>
    }
}
