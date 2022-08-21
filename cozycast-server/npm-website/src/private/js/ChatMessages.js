import { Component } from 'preact'
import { html } from 'htm/preact'

export class ChatMessages extends Component {

    chatScroll = () => {
        var messages = document.getElementById("messages");
        //chrome fix for scrollTopMax
        var scrollTop = messages.scrollTopMax ? messages.scrollTopMax : messages.scrollHeight - messages.clientHeight;
        var activateHistoryMode = 0.3 * messages.offsetHeight < scrollTop - messages.scrollTop
        if(this.props.historyMode != activateHistoryMode) {
            this.props.setChatState({historyMode: activateHistoryMode})
        }
    }
    
    scrollToBottom = () => {
        if(this.props.forceChatScroll || !this.props.historyMode) {
            var messages = document.getElementById("messages");
            messages.scrollTop = messages.scrollHeight;
            if(this.props.forceChatScroll) {
                this.props.updateRoomState({
                    forceChatScroll:  false
                })
            }
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        return this.props.chatMessages !== nextProps.chatMessages;
    }

    componentDidUpdate(prevProps, prevState) {
        if(this.props.newMessage) {
            this.scrollToBottom();
        }
    }

    deleteMessage = (id) => {
        this.props.sendMessage({
            action : 'deletemessage',
            id: id
        });
    }

    editMessage = (id, message) => {
        this.props.setChatState({
            editTarget: id,
            editContent: message
        })
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

    clickImage = (type, href) => {
        this.props.setChatState({type: type, href: href, imageModal: true})
        console.log("hello")
    }

    render({chatMessages,session}) {
        return html`<div id="chat">
            <div id="messages" onscroll=${this.chatScroll}>
                ${chatMessages.map(message => html`
                    <div class="message" key=${message.data[0].id} id=${message.data[0].id}>
                        <div class="username">${message.username + "  "}<span class="timestamp">${message.data[0].timestamp}</span> 
                            ${false && html`<div class="idSquare" style="background-color:${this.stringToColor(message.session)};"> ${session == message.session ? "You" : message.session.substr(0,3).toLowerCase()} </div>`}
                        </div>
                        ${message.data.map(data => 
                        html`
                        <div class="subMessage">
                        ${session == message.session && !data.deleted && html`<button class="deleteMessageButton" onclick=${() => this.deleteMessage(data.id)}>X</button>`}
                        ${session == message.session && data.msg != "" && html`<button class="deleteMessageButton edit" onclick=${() => this.editMessage(data.id,data.msg)}><img class="editIcon" src="/svg/edit.svg"/></button>`}
                        <div class="hoverInfo top">${data.timestamp}</div>
                        ${
                            data.messages.map( msg => html`
                                ${msg.type == "url" &&
                                    html`<span><a class="chat-link" target="_blank" href="${msg.href}">${msg.href}</a></span>
                                    `}
                                ${msg.type == "image" &&
                                    html`<div class="chat-image">
                                        <a class="chat-link" target="_blank" href="${msg.href}"><img onload="${this.scrollToBottom}" src="${msg.href}" onclick=${(e) =>{e.preventDefault(); this.clickImage("image", msg.href)}} /></a>
                                    </div>
                                    `}
                                ${msg.type == "video" &&
                                    html`<div class="chat-video">
                                        <a class="chat-link" target="_blank" href="${msg.href}"><video loop autoplay muted onloadeddata="${this.scrollToBottom}" src="${msg.href}" onclick=${(e) => {e.preventDefault();this.clickImage("video", msg.href)}}/></a>
                                    </div>
                                    `}
                                ${msg.type == "text" &&
                                    html`
                                    <span class="chat-text">${msg.message.split("\n")
                                        .map((message,index) => html`
                                            ${index != 0 && html`<br/>`}
                                            ${message}
                                        `)}</span>
                                    `}
                                ${msg.type == "deleted" &&
                                    html`<div class="chat-deleted">
                                        deleted
                                        </div>
                                    `}
                                `)
                        }
                        ${data.edited && !data.deleted && html`<span class="messageEditBadge"> (edited)</span> `} </div>`)}
                    </div>
                `)}
            </div>
        </div>`
    }
}