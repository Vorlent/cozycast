import { Component, h, Fragment } from 'preact'

export class ChatMessages extends Component {

    chatScroll = () => {
        var messages = document.getElementById("messages");
        //chrome fix for scrollTopMax
        var scrollTop = messages.scrollTopMax ? messages.scrollTopMax : messages.scrollHeight - messages.clientHeight;
        var activateHistoryMode = 0.3 * messages.offsetHeight < scrollTop - messages.scrollTop
        if (this.props.historyMode != activateHistoryMode) {
            this.props.setChatState({ historyMode: activateHistoryMode })
        }
    }

    scrollToBottom = () => {
        if (this.props.forceChatScroll || !this.props.historyMode) {
            var messages = document.getElementById("messages");
            messages.scrollTop = messages.scrollHeight;
            if (this.props.forceChatScroll) {
                this.props.updateRoomState({
                    forceChatScroll: false
                })
            }
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.chatMessages !== nextProps.chatMessages || this.props.pingLookup !== nextProps.pingLookup;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.newMessage) {
            this.scrollToBottom();
        }
    }

    deleteMessage = (id) => {
        this.props.sendMessage({
            action: 'deletemessage',
            id: id
        });
    }

    editMessage = (id, message) => {
        this.props.setChatState({
            editTarget: id,
            editContent: message
        })
    }

    stringToColor(str) {
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
        this.props.setChatState({ type: type, href: href, imageModal: true })
    }

    render({ chatMessages, session, profile }) {
        console.log(chatMessages);
        return <div id="messages" onscroll={this.chatScroll}>
            {chatMessages.map(message =>
                <div class="message" key={message.data[0].id + message.data.length} id={message.data[0].id}>
                    <div class="username" style={{ color: message.nameColor }}>{message.username}
                    <div class="real-username">{message.anonymous ? `Anon(${message.session.substr(0, 4)})` : message.session}</div>
                    <span class="timestamp">{"  " + message.data[0].timestamp}</span>
                        {false && <div class="idSquare" style={{ 'background-color': this.stringToColor(message.session) }}> {session == message.session ? "You" : message.session.substr(0, 3).toLowerCase()} </div>}
                    </div>
                    {message.data.map(data =>
                        <div class="subMessage">
                            {(profile.admin || (message.anonymous ? session == message.session : profile.username == message.session)) && !data.deleted && <button class="deleteMessageButton" onclick={() => this.deleteMessage(data.id)}>X</button>}
                            {(message.anonymous ? session == message.session : profile.username == message.session) && data.msg != "" && <button class="deleteMessageButton edit" onclick={() => this.editMessage(data.id, data.msg)}><img class="editIcon" src="/svg/edit.svg" /></button>}
                            <div class="hoverInfo top">{data.timestamp}</div>
                            {data.messages.map(msg => {
                                switch (msg.type) {
                                    case "text":
                                        return <span class="chat-text"> {msg.message.split("\n").map((message, index) => <Fragment>{index != 0 && <br />}{message}</Fragment>)}</span>
                                    case "ping":
                                        if (msg.target == this.props.profile.pingName) return <span class="chat-ping"> {msg.message}</span>
                                        else if (this.props.pingLookup[msg.target] > 0) return <span class="chat-ping-other"> {msg.message}</span>
                                        else return <span class="chat-text"> {msg.message}</span>
                                    case "url":
                                        return <span><a class="chat-link" target="_blank" href={msg.href}>{msg.value}</a></span>;
                                    case "image":
                                        return <div class="chat-image">
                                            <a tabindex="-1" class="chat-link" target="_blank" href={msg.href}><img tabindex="-1" onload={this.scrollToBottom} src={msg.href} alt={msg.href} onclick={(e) => { e.preventDefault(); this.clickImage("image", msg.href) }} /></a>
                                        </div>
                                    case "video":
                                        return <div class="chat-video">
                                            <a tabindex="-1" class="chat-link" target="_blank" href={msg.href}><video tabindex="-1" loop autoplay muted onloadeddata={this.scrollToBottom} src={msg.href} onclick={(e) => { e.preventDefault(); this.clickImage("video", msg.href) }} /></a>
                                        </div>
                                    case "deleted":
                                        return <div class="chat-deleted">deleted </div>;
                                    default: return <div>Looks like something went wrong!</div>
                                }
                            })}
                            {data.edited && !data.deleted && <span class="messageEditBadge"> (edited)</span>}
                        </div>
                    )
                    }
                </div>
            )}
        </div>
    }
}