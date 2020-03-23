import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState } from '/js/index.js'
import { sendMessage } from '/js/Room.js'

var lastTypingEvent = Date.now();
function chatInput(e) {
    updateState(function(state) {
        var enterKeycode = 13;
        state.chatBox = e.target.value;
        var now = Date.now();
        if(now - lastTypingEvent > 1000) {
            sendMessage({
                action : 'typing',
                state: 'start',
                username: state.username
            });
            lastTypingEvent = now;
        }
    })
}

function chatEnter(e) {
    updateState(function(state) {
        var enterKeycode = 13;
        if(e.which == enterKeycode) {
            e.preventDefault();
            if(e.shiftKey) {
                updateState(function (state)  {
                    state.chatBox += "\n"
                    e.target.value = state.chatBox; // hack
                });
            } else {
                if(state.chatBox.trim() != "") {
                    sendMessage({
                        action : 'chatmessage',
                        type: "text",
                        message: state.chatBox,
                        username: state.username
                    });
                }
                state.chatBox = "";
                e.target.value = state.chatBox; // hack

                sendMessage({
                    action : 'typing',
                    state: 'stop',
                    username: state.username
                });
            }
        }
    })
}

function openPictureUpload() {
    document.getElementById('image-upload-file').click();
}

function imageSelected(e) {
    let formData = new FormData();
    if(e.target.files.length > 0) {
        formData.append("image", e.target.files[0]);
        fetch('/image/upload', {method: "POST", body: formData}).then((e) => e.json()).then(function (e) {
            sendMessage({
                action: 'chatmessage',
                image: e.url,
                type: e.type,
                message: "",
                username: state.username
            });
        });
    }
}

export class Chat extends Component {
    constructor() {
        super()
        this.typingInterval = null;
    }

    componentDidMount() {
         this.typingInterval = setInterval(function() {
             updateState(function (state) {
                 state.typingUsers = state.typingUsers.filter(function(user) {
                     return user.lastTypingTime.isAfter(moment().subtract(3, 'seconds'));
                 });
             })
         }, 1000);
    }

    componentWillUnmount() {
        if(this.typingInterval) {
            clearInterval(this.typingInterval)
        }
    }

    componentDidUpdate() {
        if(state.newMessage) {
            updateState(function (state) {
                state.newMessage = false
            })
            this.scrollToBottom();
        }
    }

    chatScroll() {
        var messages = document.getElementById("messages");
        var activateHistoryMode = 0.3 * messages.offsetHeight < messages.scrollTopMax - messages.scrollTop
        if(state.historyMode != activateHistoryMode) {
            updateState(function (state) {
                state.historyMode = activateHistoryMode
            })
        }
    }

    scrollToBottom() {
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

    render({ state }, { xyz = [] }) {
        return html`<div id="chat">
            ${state.historyMode && html`<div class="history-mode-indicator">Old messages</div>`}
            <div id="messages" onscroll=${this.chatScroll}>
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
                            ${msg.type == "video" &&
                                html`<div class="chat-video">
                                    <a class="chat-link" target="_blank" href="${msg.href}"><video loop autoplay muted onload="${this.scrollToBottom}" src="${msg.href}" /></a>
                                </div>`}
                            ${msg.type == "text" &&
                                html`<div>${msg.message.split("\n")
                                    .map(message => html`
                                        ${message}
                                        <br/>
                                    `)}</div>`}
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
                <div class="image-uploader">
                    <textarea id="chatbox-textarea" oninput=${chatInput} onkeypress=${chatEnter}>
                        ${state.chatBox}
                    </textarea>
                    <div class="image-uploader-button-wrapper">
                        <input id="image-upload-file" type="file" name="image" accept="image/png, image/jpeg, image/gif, video/webm" onchange=${imageSelected}/>
                        ${state.chatBox.length == 0 &&
                            html`<img class="image-uploader-button" src="/svg/image_upload.svg" onclick=${openPictureUpload}/>`}
                    </div>
                </div>
            </div>
        </div>`
    }
}
