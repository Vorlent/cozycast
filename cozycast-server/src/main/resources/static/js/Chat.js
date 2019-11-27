import { html, Component } from '/js/libs/preact.standalone.module.js'
import { state, updateState, sendMessage } from '/js/index.js'

var typingTimer;
function chatKeypress(e) {
    updateState(function() {
        var enterKeycode = 13;
        state.chatBox = e.target.value;
        if(e.which == enterKeycode) {
            e.preventDefault();
            if(state.chatBox.trim() != "") {
                sendMessage({
                    action : 'chatmessage',
                    message: state.chatBox,
                    username: state.username
                });
            }
            e.target.value = ""; // hack
            state.chatBox = "";

            clearTimeout(typingTimer)
            typingTimer = null;
            sendMessage({
                action : 'typing',
                state: 'stop',
                username: state.username
            });
        } else {
            if(typingTimer) {
                clearTimeout(typingTimer)
                typingTimer = null;
            } else {
                sendMessage({
                    action : 'typing',
                    state: 'start',
                    username: state.username
                });
            }

            typingTimer = setTimeout(function() {
                sendMessage({
                    action : 'typing',
                    state: 'stop',
                    username: state.username
                });
                typingTimer = null;
            }, 2000)
        }
    })
}


export class Chat extends Component {
    componentDidUpdate() {
    	this.scrollToBottom();
    }

    scrollToBottom() {
        var messages = document.getElementById("messages");
        messages.scrollTop = messages.scrollHeight;
    }

    render({ state }, { xyz = [] }) {
        return html`<div id="chat">
            <div id="messages">
                ${state.chatMessages.map(message => html`
                    <div class="message">
                        <div class="username">${message.username + " " + message.timestamp}</div>
                        ${message.messages.map(msg => html`
                            ${msg.type == "url" &&
                                html`<div><a class="chat-link" target="_blank" href="${msg.href}">${msg.href}</a></div>`}
                            ${msg.type == "image" &&
                                html`<div class="chat-image">
                                    <a class="chat-link" target="_blank" href="${msg.href}"><img onload="${this.scrollToBottom}" src="${msg.href}" /></a>
                                </div>`}
                            ${msg.type == "text" &&
                                html`<div>${msg.message}</div>`}
                        `)}
                    </div>
                `)}
            </div>
            <div id="chatbox">
                <div id="typing">
                    ${state.typingUsers.length > 0 && html`
                        ${state.typingUsers.map((user, i) => html`
                            ${user.username}${(state.typingUsers.length - 1 != i) && ', '}
                        `)} ${state.typingUsers.length > 1 ? 'are' : 'is'} typing...
                    `}
                </div>
                <textarea id="chatbox-textarea" onkeypress=${chatKeypress}>
                    ${state.chatBox}
                </textarea>
            </div>
        </div>`
    }
}
