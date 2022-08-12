import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { ChatInput } from '/js/ChatInput.js'
import { ChatMessages } from '/js/ChatMessages.js';
import { ImageModal } from '/js/ImageModal.js';

export class Chat extends Component {
    constructor() {
        super();
        this.state = {
            historyMode: false,
            imageModal: false
        }
    }

    render({state}) {
        var roomId = state.roomId;
        if(roomId == null || roomId == "default") {
            roomId = "";
        }
        return html`<div id="chat">
            ${this.state.imageModal && html`<${ImageModal} type=${this.state.type} href=${this.state.href} setChatState=${this.setState.bind(this)}/>`}
            ${this.state.historyMode && html`<div class="history-mode-indicator">Old messages</div>`}
            <${ChatMessages} sendMessage=${this.props.sendMessage} historyMode=${this.state.historyMode} 
                chatMessages=${this.props.state.chatMessages} session=${this.props.state.session} 
                newMessage=${this.props.state.newMessage} setChatState=${this.setState.bind(this)}
                forceChatScroll=${this.props.state.forceChatScroll} updateRoomState=${this.props.updateRoomState}/>
            <${ChatInput} sendMessage=${this.props.sendMessage} historyMode=${this.state.historyMode}/>
        </div>`
    }
}
