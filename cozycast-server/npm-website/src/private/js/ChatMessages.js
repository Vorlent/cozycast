import { h, Fragment } from 'preact';
import { useEffect, useContext, useCallback, useRef } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext';
import { AppStateContext } from './appstate/AppStateContext.js';
import { memo } from 'preact/compat';
import { useSignal } from '@preact/signals';

const TextInput = ({ sendMessage, value, editInfo, scrollToBottom }) => {
    const text = useSignal(value);
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
        scrollToBottom();
    }, []);

    useEffect(() => {
        if (ref.current) {
            var ta = ref.current;
            ta.style.height = '0px';
            var height = ta.scrollHeight;
            ta.style.height = height + 'px';
            scrollToBottom();
        }
    }, [text.value]);


    const handleKeyDown = (e) => {
        if (e.key == 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
        else if (e.key == 'Escape') {
            e.preventDefault();
            exit();
        }
    }

    const send = () => {
        let trimmed = text.value;
        if (trimmed.trim() != "") {
            sendMessage({
                action: 'editmessage',
                id: editInfo.value.id,
                message: text.value
            })
            editInfo.value = {};
        }
    }

    const exit = () => {
        editInfo.value = {};
    }

    const handleOnInput = (e) => {
        if (!editInfo.value.isWriting) editInfo.value.isWriting = true;
        text.value = e.target.value;
    };

    return (
        <>
            <div class="ta-wrapper" style={{ "border-radius": "3px" }}>
                <textarea id="chat-textbox"
                    ref={ref}
                    value={text}
                    class="chatbox-textarea"
                    onKeyDown={handleKeyDown}
                    onInput={handleOnInput} />
            </div>
            <p class='edit-info-text'>Esc to <a onclick={exit}>cancel</a>, Enter to  <a onclick={send}>send</a> </p>
        </>
    );
};

const HistoryModeBadge = ({ display, leaveHistoryMode }) => {
    if (display.value) return <div className="history-mode-badge" onClick={leaveHistoryMode}></div>
}

const TempMessage = memo(({ message, showLeaveJoinMsg }) => {
    return showLeaveJoinMsg ? (
        <div className="message temp-message" key={message.id} id={message.id}>
            <div className="hoverInfo left">{message.timestamp}</div>
            <div className="temp-chat-text">{message.content}</div>
        </div>
    ) : null;
})

function SubMessages({ data, message, profile, session, deleteMessage, clickImage, pingLookup, sendMessage, editInfo, scrollToBottom }) {
    if (editInfo.value.id == data.id) {
        return <TextInput value={editInfo.value.msg} editInfo={editInfo} sendMessage={sendMessage} scrollToBottom={scrollToBottom} />
    }
    return (
        <div className="subMessage">
            {(profile.value.admin ||
                (session.value === message.session)) &&
                !data.deleted && (
                    <button className="deleteMessageButton" onClick={() => deleteMessage(data.id)}>
                        X
                    </button>
                )}
            {(session.value === message.session) &&
                data.msg !== "" && (
                    <button
                        className="deleteMessageButton edit"
                        onClick={() => { editInfo.value = { id: data.id, msg: data.msg } }}
                    >
                        <img className="editIcon" src="/svg/edit.svg" />
                    </button>
                )}
            <div className="hoverInfo top">{data.timestamp}</div>
            {data.messages.map(msg => {
                switch (msg.type) {
                    case "text":
                        return <span class="chat-text"> {msg.message.split("\n").map((message, index) => <Fragment>{index != 0 && <br />}{message}</Fragment>)}</span>
                    case "ping":
                        if (msg.target == profile.value.pingName) return <span class="chat-ping"> {msg.message}</span>
                        else if (pingLookup.value[msg.target] > 0) return <span class="chat-ping-other"> {msg.message}</span>
                        else return <span class="chat-text"> {msg.message}</span>
                    case "url":
                        return <span><a class="chat-link" target="_blank" href={msg.href}>{msg.value}</a></span>;
                    case "image":
                        return <div class="chat-image">
                            <a tabindex="-1" class="chat-link" target="_blank" href={msg.href}><img tabindex="-1" onload={scrollToBottom} src={msg.href} alt={msg.href} onclick={(e) => { e.preventDefault(); clickImage("image", msg.href) }} /></a>
                        </div>
                    case "video":
                        return <div class="chat-video">
                            <a tabindex="-1" class="chat-link" target="_blank" href={msg.href}><video tabindex="-1" loop autoplay muted onloadeddata={scrollToBottom} src={msg.href} onclick={(e) => { e.preventDefault(); clickImage("video", msg.href) }} /></a>
                        </div>
                    case "deleted":
                        return <div class="chat-deleted">deleted </div>;
                    case "whisper":
                        return <div class="chat-deleted">{msg.message}</div>;
                    default:
                        return <div class="chat-deleted">Error</div>
                }
            })}
            {data.edited && !data.deleted && <span className="messageEditBadge"> (edited)</span>}
        </div>
    );
}

const Message = memo(({ message, profile, session, deleteMessage, clickImage, pingLookup, sendMessage, editInfo, scrollToBottom }) => {
    return (
        <div className="message" key={message.data[0].id + message.data.length} id={message.data[0].id}>
            <div className="username" style={{ color: message.nameColor }}>
                {message.username}
                <div className="real-username">
                    {message.anonymous ? `Anon(${message.session.substr(0, 4)})` : message.session}
                </div>
                <span className="timestamp">{"  " + message.data[0].timestamp}</span>
            </div>
            {message.data.map((data) => (
                <SubMessages
                    data={data}
                    message={message}
                    profile={profile}
                    session={session}
                    deleteMessage={deleteMessage}
                    clickImage={clickImage}
                    pingLookup={pingLookup}
                    sendMessage={sendMessage}
                    editInfo={editInfo}
                    scrollToBottom={scrollToBottom}
                />
            ))}
        </div>
    );
})



const ChatMessages = ({ historyMode, imageModal }) => {
    const { chatMessages, sendMessage, pingLookup, session } = useContext(WebSocketContext);
    const { profile, userSettings } = useContext(AppStateContext);
    const { showLeaveJoinMsg } = userSettings.value;
    const editInfo = useSignal({});
    const messageBody = useRef(null);

    const isUserScroll = useRef(false);
    const chatScroll = (e, usedWheel) => {
        const activateHistoryMode = messageBody.current.scrollHeight - (messageBody.current.scrollTop + messageBody.current.clientHeight) > 30;
        if (historyMode.value !== activateHistoryMode) {
            if (activateHistoryMode && (usedWheel || isUserScroll.current))
                historyMode.value = true;
            else if (!activateHistoryMode) {
                historyMode.value = false;
            }
        }
    };

    const handleMouseUp = () => {
        isUserScroll.current = false;
    }

    const handleMouseDown = () => {
        isUserScroll.current = true;
    }

    const handeChatWheel = (event) => {
        if (event.deltaY < 0) {
            setTimeout(() => {
                chatScroll(null,true);
              }, 100);
        }
    }

    const scrollToBottom = useCallback(() => {
        if (!(historyMode.value)) {
            messageBody.current.scrollTop = messageBody.current.scrollHeight;
        }
    }, []);

    const leaveHistoryMode = useCallback(() => {
        messageBody.current.scrollTop = messageBody.current.scrollHeight;
        historyMode.value = false;
    }, []);

    useEffect(() => {
        window.addEventListener('resize', scrollToBottom);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("touchend", handleMouseUp);
        scrollToBottom();
        return () => {
            window.removeEventListener('resize', scrollToBottom);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages.value]);

    const deleteMessage = useCallback((id) => {
        sendMessage({
            action: 'deletemessage',
            id: id,
        });
    }, [sendMessage]);


    const clickImage = useCallback((type, href) => {
        imageModal.value = { type: type, href: href, display: true };
    }, []);

    return (
        <div id="messages" ref={messageBody}
            onWheel={handeChatWheel}
            onscroll={chatScroll}
            onmousedown={handleMouseDown}
            onTouchStart={handleMouseDown}
            >
            {chatMessages.value.map((message) =>
                message.tempMessage ? (
                    <TempMessage message={message} showLeaveJoinMsg={showLeaveJoinMsg} />
                ) : (
                    <Message
                        message={message}
                        profile={profile}
                        session={session}
                        deleteMessage={deleteMessage}
                        clickImage={clickImage}
                        pingLookup={pingLookup}
                        sendMessage={sendMessage}
                        editInfo={editInfo}
                        scrollToBottom={scrollToBottom}
                    />
                )
            )}
            <HistoryModeBadge display={historyMode} leaveHistoryMode={leaveHistoryMode} />
        </div>
    );
};

export default ChatMessages;