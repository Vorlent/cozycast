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

    render({ state: propsState }, state) {
        var roomId = state.roomId;
        if (roomId == null || roomId == "default") {
            roomId = "";
        }
        return <div id="chat">
            {this.state.imageModal &&
                <ImageModal
                    type={this.state.type}
                    href={this.state.href}
                    setChatState={this.setState.bind(this)} />}
            <ChatMessages
                sendMessage={this.props.sendMessage}
                historyMode={state.historyMode}
                chatMessages={propsState.chatMessages}
                session={propsState.session}
                newMessage={propsState.newMessage} 
                setChatState={this.setState.bind(this)}
                forceChatScroll={propsState.forceChatScroll}
                updateRoomState={this.props.updateRoomState}
                profile={this.props.profile}
                pingLookup={this.props.pingLookup}
                showLeaveJoinMsg={propsState.userSettings.showLeaveJoinMsg}
            />
            <ChatInput
                sendMessage={this.props.sendMessage}
                historyMode={state.historyMode}
                editContent={state.editContent}
                editTarget={state.editTarget}
                viewPort={propsState.viewPort}
                setChatState={this.setState.bind(this)}
                permissions={this.props.permissions}
                profile={this.props.profile} />
        </div>
    }
}
