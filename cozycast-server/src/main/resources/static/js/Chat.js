import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState } from '/js/index.js'
import { sendMessage } from '/js/Room.js'
import { ConfirmUpload, openConfirmWindow, openConfirmWindowPaste } from '/js/ConfirmUpload.js'

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

export class Chat extends Component {
    constructor() {
        super()
        this.typingInterval = null;
    }

    componentDidMount() {
         this.typingInterval = setInterval(function() {
             updateState(function (state) {
                 var newTypingUsers = state.typingUsers.filter(function(user) {
                     return user.lastTypingTime.isAfter(moment().subtract(3, 'seconds'));
                 });
                 if(newTypingUsers.length != state.typingUsers.length) {
                     state.typingUsers = newTypingUsers
                 } else {
                     // no change, no update
                     return false
                 }
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
        //chrome fix for scrollTopMax
        var scrollTop = messages.scrollTopMax ? messages.scrollTopMax : messages.scrollHeight - messages.clientHeight;
        var activateHistoryMode = 0.3 * messages.offsetHeight < scrollTop - messages.scrollTop
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

    autosize() {
        var div = document.querySelector('.ta-wrapper');
        var ta =  document.querySelector('.chatbox-textarea');
        var messages = document.getElementById("messages");
 
     setTimeout(function() {
         ta. style.cssText = 'height:0px';
         var height = Math.min(18*5, ta.scrollHeight);
         div.style.cssText = 'height:' + (20 + height) + 'px';
         ta. style.cssText = 'height:' + height + 'px';
         messages.scrollTop = messages.scrollHeight;
        },0);
    }

    render({ state }, { xyz = [] }) {
        var roomId = state.roomId;
        if(roomId == null || roomId == "default") {
            roomId = "";
        }
        return html`<div id="chat">
            ${state.historyMode && html`<div class="history-mode-indicator">Old messages</div>`}
            <div id="messages" onscroll=${this.chatScroll}>
                ${state.chatMessages.map(message => html`
                    <div class="message">
                        <div class="username">${message.username + "  "}<span class="timestamp">${message.timestamp}</span></div>
                        ${message.messages.map(msg => html`
                            ${msg.type == "url" &&
                                html`<div><a class="chat-link" target="_blank" href="${msg.href}">${msg.href}</a></div>`}
                            ${msg.type == "image" &&
                                html`<div class="chat-image">
                                    <a class="chat-link" target="_blank" href="${msg.href}"><img onload="${this.scrollToBottom}" src="${msg.href}" /></a>
                                </div>`}
                            ${msg.type == "video" &&
                                html`<div class="chat-video">
                                    <a class="chat-link" target="_blank" href="${msg.href}"><video loop autoplay muted onloadeddata="${this.scrollToBottom}" src="${msg.href}" /></a>
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
            <${ConfirmUpload} state=${state}/>
            <div id="chatbox">
                <div class="image-uploader">
                    <div class="ta-wrapper">
                    <textarea class="chatbox-textarea" oninput=${chatInput} onkeypress=${chatEnter} onkeydown="${this.autosize}" onpaste=${openConfirmWindowPaste}>
                        ${state.chatBox}
                    </textarea>
                    </div>
                    <div class="image-uploader-button-wrapper">
                        <input id="image-upload-file" type="file" name="image" accept="image/png, image/jpeg, image/gif, video/webm,  image/webp" onchange=${openConfirmWindow}/>
                        ${(state.chatBox.length == 0) &&
                            html`<img class="image-uploader-button" src="/svg/image_upload.svg" onclick=${openPictureUpload}/>`}
                    </div>
                </div>
                <div id="typing">
                    ${state.typingUsers.length > 0 && html`
                        ${state.typingUsers.length > 2 ? "Several people" : state.typingUsers.map((user, i) => html`${user.username}${(state.typingUsers.length - 1 != i) && ', '}`)} ${state.typingUsers.length > 1 ? 'are ' : 'is '}
                        <div class="typingWrapper">typing<div class="loadingDotsWrapper"><div class="loadingDots"></div></div></div>
                    `}
                </div>
            </div>
        </div>`
    }

    
}
