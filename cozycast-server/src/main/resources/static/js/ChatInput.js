import { Component, createRef } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { ConfirmUpload } from '/js/ConfirmUpload.js'

var globalTypingUsers = [];
var chatInputState = {};

export function typing(parsedMessage) {
    if(parsedMessage.state == "start") {
        var typingUser = globalTypingUsers.find(e => e.session == parsedMessage.session)
        if(typingUser) {
            typingUser.lastTypingTime = moment()
        } else {
            globalTypingUsers.push({
                username: parsedMessage.username,
                session: parsedMessage.session,
                lastTypingTime: moment()
            })
        }
    } else if(parsedMessage.state == "stop") {
        globalTypingUsers = globalTypingUsers.filter(function(user) {
            return user.session != parsedMessage.session;
        });
    }
    chatInputState.setState(globalTypingUsers);
}

export function filterTyping(session){
    globalTypingUsers = globalTypingUsers.filter(function(user) {
        return user.session != session;
    });
    chatInputState.setState(globalTypingUsers);
}

export function clearTyping(){
    chatInputState.setState(globalTypingUsers);
}


export class ChatInput extends Component {
    constructor() {
        super();
        chatInputState.setState = (data) => {
            this.setState({typingUsers: data});
        };
        this.typingInterval = null;
        this.clearFile = this.clearFile.bind(this);
        this.lastTypingEvent = Date.now();
        this.state = { 
            chatBox: "",
            typingUsers: [],
            sendFile: false,
            pasteFile: false,
            editTarget: null
        };
    }

    clearFile() {
        if(this.state.sendFile) this.state.sendFile.target.value = "";
        this.setState({sendFile: false, pasteFile: false})
    }

    shouldComponentUpdate(nextProps, nextState){
        return this.state !== nextState || nextProps.editTarget !== this.state.editTarget;
    }

    componentDidUpdate(prevProps, prevState) {
        if(this.state.editTarget !== this.props.editTarget) {
            this.setState({editTarget: this.props.editTarget, chatBox: this.props.editContent})
            this.refChatboxText.current.focus();
        }
        this.autosize();
    }

    componentDidMount() {
         this.typingInterval = setInterval(() => {
                 var newTypingUsers = globalTypingUsers.filter(function(user) {
                    return user.lastTypingTime.isAfter(moment().subtract(3, 'seconds'));
                 });
                 if(newTypingUsers.length != globalTypingUsers.length) {
                    globalTypingUsers = newTypingUsers
                    this.setState({typingUsers: globalTypingUsers});
                 }
         }, 1000);
    }

    componentWillUnmount() {
        if(this.typingInterval) {
            clearInterval(this.typingInterval)
        }
    }

    openConfirmWindow= (e) => {
        this.setState({sendFile: e})
    }
    
    openConfirmWindowPaste= (e) => {
        if(e.clipboardData) {
            var items = e.clipboardData.items
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") == -1) continue
                var blob = items[i].getAsFile()
                this.setState({pasteFile: blob})
           }
        };
    
    }

    chatInput = (e) => {
        var enterKeycode = 13;
        this.setState({chatBox: e.target.value})
        var now = Date.now();
        if(now - this.lastTypingEvent > 1000) {
            this.props.sendMessage({
                action : 'typing',
                state: 'start'
            });
            this.lastTypingEvent = now;
        }
    }

    chatEnter = (e) => {
        var enterKeycode = 13;
        if(e.which == enterKeycode) {
            e.preventDefault();
            if(e.shiftKey) {
                let newChatBox = this.state.chatBox += "\n";
                this.setState({chatBox: newChatBox})
            } else {
                if(this.state.chatBox.trim() != "") {
                    if(this.state.editTarget !== null){
                        this.props.sendMessage({
                            action : 'editmessage',
                            id: this.state.editTarget,
                            message: this.state.chatBox
                        });
                    }
                    else{
                        this.props.sendMessage({
                            action : 'chatmessage',
                            type: "text",
                            message: this.state.chatBox
                        });
                    }
                }
                if(this.state.editTarget !== null){
                    this.exitEdit();
                }
                else {
                this.setState({chatBox: ""})
                }

                this.props.sendMessage({
                    action : 'typing',
                    state: 'stop'
                });
            }
        }
    }
    
    refTaWrapper = createRef();
    refChatboxText = createRef();
    autosize = () => {
        var div = this.refTaWrapper.current;
        var ta =  this.refChatboxText.current;
        var messages = document.getElementById("messages");

        ta. style.cssText = 'height:0px';
        var height = Math.min(18*5, ta.scrollHeight);
        div.style.cssText = 'height:' + (20 + height) + 'px';
        ta. style.cssText = 'height:' + height + 'px';
        if(!this.props.historyMode) messages.scrollTop = messages.scrollHeight;
    }
    
    refImageUploadFile = createRef();
    openPictureUpload =() => {
        this.refImageUploadFile.current.click();
    }

    exitEdit = () => {
        this.props.setChatState({editTarget: null, editContent: ""});
    }

    render({state}) {
        return html`
            <${ConfirmUpload} sendFile=${this.state.sendFile} pasteFile=${this.state.pasteFile} clear=${this.clearFile} sendMessage=${this.props.sendMessage}/>
            <div id="chatbox" onclick=${() => this.refChatboxText.current.focus()}>
                ${this.state.editTarget && html`<button class="editMode" onclick=${this.exitEdit}>End Edit</button>`}
                <div class="image-uploader">
                    <div class="ta-wrapper" ref=${this.refTaWrapper}>
                    <textarea id="chat-textbox" ref=${this.refChatboxText} value=${this.state.chatBox} class="chatbox-textarea" oninput=${this.chatInput} onkeypress=${this.chatEnter} onpaste=${this.openConfirmWindowPaste}>
                    </textarea>
                    </div>
                    <div class="image-uploader-button-wrapper">
                        <input id="image-upload-file" type="file" name="image" accept="image/png, image/jpeg, image/gif, video/webm,  image/webp" onchange=${this.openConfirmWindow} ref=${this.refImageUploadFile}/>
                        ${!this.state.chatBox.length != 0 &&
                            html`<img class="image-uploader-button" src="/svg/image_upload.svg" onclick=${this.openPictureUpload}/>`}
                    </div>
                </div>
                <div id="typing">
                    ${this.state.typingUsers.length > 0 && html`
                        ${this.state.typingUsers.length > 2 ? "Several people" : this.state.typingUsers.map((user, i) => html`${user.username}${(this.state.typingUsers.length - 1 != i) && ', '}`)} ${this.state.typingUsers.length > 1 ? 'are ' : 'is '}
                        <div class="typingWrapper">typing<div class="loadingDotsWrapper"><div class="loadingDots"></div></div></div>
                    `}
                </div>
            </div>
            `
    }
}
