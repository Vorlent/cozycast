import { Component, createRef, h, Fragment } from 'preact'
import { ConfirmUpload } from './ConfirmUpload.js'
import { ScreenshotModal } from './ScreenshotModal.js';
import moment from 'moment'

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
            editTarget: null,
            screenshotModal: false,
            currentScreenshot: null
        };
    }

    clearFile() {
        if(this.state.sendFile) this.state.sendFile.target.value = "";
        this.setState({sendFile: false, pasteFile: false})
    }

    shouldComponentUpdate(nextProps, nextState){
        return this.state !== nextState || nextProps.editTarget !== this.state.editTarget || this.props.permissions != nextProps.permissions;
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
        if(!this.props.permissions.imagePermission) return;
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

    screenshot = () => {
        let canvas = document.createElement('canvas');
        let video = document.getElementById('video');

        canvas.width = this.props.viewPort.width;
        canvas.height = this.props.viewPort.height;

        let ctx = canvas.getContext('2d');
        ctx.drawImage( video, 0, 0, canvas.width, canvas.height );

        let image = canvas.toDataURL('image/png');

        this.setState((oldState) => {return {
            screenshotModal: true,
            currentScreenshot: image,
        }})
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

    render(_,state) {
        return <Fragment>
            {this.state.screenshotModal && <ScreenshotModal href={this.state.currentScreenshot} sendMessage={this.props.sendMessage} setChatState={this.setState.bind(this)}></ScreenshotModal>}
            <ConfirmUpload sendFile={this.state.sendFile} pasteFile={this.state.pasteFile} clear={this.clearFile} sendMessage={this.props.sendMessage} screenshot={this.state.screenshotModal}/>
            <div id="chatbox" onclick={() => this.refChatboxText.current.focus()}>
                {this.state.editTarget && <button class="editMode" onclick={this.exitEdit}>End Edit</button>}
                <div class={`image-uploader ${this.state.chatBox.length != 0 ? "hasText" : ""}`}>
                    <div class="ta-wrapper" ref={this.refTaWrapper}>
                        <textarea id="chat-textbox" ref={this.refChatboxText} value={this.state.chatBox} class="chatbox-textarea" oninput={this.chatInput} onkeypress={this.chatEnter} onpaste={this.openConfirmWindowPaste}>
                        </textarea>
                    </div>
                    {this.props.permissions.imagePermission && this.props.profile.username &&
                    <div class="image-uploader-button-wrapper">
                        <input id="image-upload-file" type="file" name="image" accept="image/png, image/jpeg, image/gif, video/webm,  image/webp" onchange={this.openConfirmWindow} ref={this.refImageUploadFile}/>
                        {this.state.chatBox.length == 0 && <Fragment><img class="image-uploader-button" src="/svg/screenshot.svg" onclick={this.screenshot}/><img class="image-uploader-button" src="/svg/image_upload.svg" onclick={this.openPictureUpload}/></Fragment>}
                    </div>
                    }
                </div>
                <div id="typing">
                    {this.state.typingUsers.length > 0 && <Fragment>
                        {this.state.typingUsers.length > 2 ? "Several people" : this.state.typingUsers.map((user, i) => `${user.username}${(this.state.typingUsers.length - 1 != i) ? ', ' : ''}`) } {this.state.typingUsers.length > 1 ? 'are ' : 'is '}
                        <div class="typingWrapper">typing<div class="loadingDotsWrapper"><div class="loadingDots"></div></div></div>
                        </Fragment>}
                </div>
            </div>
            </Fragment>
    }
}
