import { html, Component } from '/js/libs/preact.standalone.module.js'
import { state, updateState, sendMessage } from '/js/index.js'

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
            if(state.chatBox.trim() != "") {
                sendMessage({
                    action : 'chatmessage',
                    type: "text",
                    message: state.chatBox,
                    username: state.username
                });
            }
            e.target.value = ""; // hack
            state.chatBox = "";

            sendMessage({
                action : 'typing',
                state: 'stop',
                username: state.username
            });
        }
    })
}

function openPictureUpload() {
    document.getElementById('image-upload-file').click();
}

function imageSelected(e) {
    let formData = new FormData();
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

export class Chat extends Component {
    typingInterval = null;

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

    scrollToBottom() {
        var messages = document.getElementById("messages");
        if(0.9 * messages.scrollTopMax < messages.scrollTop) {
            messages.scrollTop = messages.scrollHeight;
        }
        if(state.forceChatScroll) {
            messages.scrollTop = messages.scrollHeight;
            updateState(function (state) {
                state.forceChatScroll = false
            })
        }
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
                            ${msg.type == "video" &&
                                html`<div class="chat-video">
                                    <a class="chat-link" target="_blank" href="${msg.href}"><video autoplay muted onload="${this.scrollToBottom}" src="${msg.href}" /></a>
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
                <audio id="pop" controls="" src="/audio/pop.wav" autoplay="" preload="auto" />
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
