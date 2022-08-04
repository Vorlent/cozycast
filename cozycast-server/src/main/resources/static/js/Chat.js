import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState } from '/js/index.js'
import { sendMessage } from '/js/Room.js'
import { ChatInput } from '/js/ChatInput.js'

function deleteMessage(id){
    sendMessage({
        action : 'deletemessage',
        id: id
    });
}

export function chatScroll() {
    var messages = document.getElementById("messages");
    //chrome fix for scrollTopMax
    var scrollTop = messages.scrollTopMax ? messages.scrollTopMax : messages.scrollHeight - messages.clientHeight;
    var activateHistoryMode = 0.3 * messages.offsetHeight < scrollTop - messages.scrollTop
    if(state.historyMode != activateHistoryMode) {
        updateState(function (state) {
            state.historyMode = activateHistoryMode
        })
    }
}

export function scrollToBottom() {
    if(!state.historyMode || state.forceChatScroll) {
        var messages = document.getElementById("messages");
        messages.scrollTop = messages.scrollHeight;
        if(state.forceChatScroll) {
            updateState(function (state) {
                state.forceChatScroll = false
            })
        }
    }
}

export class Chat extends Component {
    constructor() {
        super();
        this.typingInterval = null;
    }

    componentDidUpdate() {
        if(state.newMessage) {
            updateState(function (state) {
                state.newMessage = false
            })
            scrollToBottom();
        }
    }

    stringToColor(str){
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        var colour = '#';
        for (var i = 0; i < 3; i++) {
          var value = (hash >> (i * 8)) & 0xFF;
          colour += ('00' + value.toString(16)).substr(-2);
        }
        return colour;
    }

    render({state}) {
        var roomId = state.roomId;
        if(roomId == null || roomId == "default") {
            roomId = "";
        }
        return html`<div id="chat">
            ${state.historyMode && html`<div class="history-mode-indicator">Old messages</div>`}
            <div id="messages" onscroll=${chatScroll}>
                ${state.chatMessages.map(message => html`
                    <div class="message" key=${message.data[0].id} id=${message.data[0].id}>
                        <div class="username">${message.username + "  "}<span class="timestamp">${message.data[0].timestamp}</span> 
                            ${false && html`<div class="idSquare" style="background-color:${this.stringToColor(message.session)};"> ${state.session == message.session ? "You" : message.session.substr(0,3).toLowerCase()} </div>`}
                        </div>
                        ${message.data.map(data => 
                        html`
                        <div class="subMessage">
                        ${state.session == message.session && !data.deleted && html`<button class="deleteMessageButton" onclick=${() => deleteMessage(data.id)}>X</button>`}
                        ${
                            data.messages.map( msg => html`
                                ${msg.type == "url" &&
                                    html`<div><a class="chat-link" target="_blank" href="${msg.href}">${msg.href}</a></div>
                                `}
                                ${msg.type == "image" &&
                                    html`<div class="chat-image">
                                        <a class="chat-link" target="_blank" href="${msg.href}"><img onload="${scrollToBottom}" src="${msg.href}" /></a>
                                    </div>
                                `}
                                ${msg.type == "video" &&
                                    html`<div class="chat-video">
                                        <a class="chat-link" target="_blank" href="${msg.href}"><video loop autoplay muted onloadeddata="${scrollToBottom}" src="${msg.href}" /></a>
                                    </div>
                                `}
                                ${msg.type == "text" &&
                                    html`<div class="chat-text">${msg.message.split("\n")
                                        .map(message => html`
                                            ${message}
                                            <br/>
                                        `)}</div>
                                `}
                                ${msg.type == "deleted" &&
                                    html`<div class="chat-deleted">
                                        deleted
                                        </div>
                                `}
                            `)
                        }
                        </div>`)}
                    </div>
                `)}
            </div>
            <${ChatInput} state=${state}/>
        </div>`
    }

    
}
