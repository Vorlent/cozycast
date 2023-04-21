import moment from 'moment';
import { Fragment, h } from 'preact';
import { ConfirmUpload } from './ConfirmUpload.js';
import { ScreenshotModal } from './ScreenshotModal.js';
import { useCallback, useContext, useEffect, useRef } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext.js';
import { batch, useSignal } from '@preact/signals';

const TypingBox = () => {
    const { typingUsers } = useContext(WebSocketContext);

    useEffect(() => {
        let typingInterval = setInterval(() => {
            var newTypingUsers = typingUsers.value.filter(function (user) {
                return user.lastTypingTime.isAfter(moment().subtract(3, 'seconds'));
            });
            if (newTypingUsers.length != typingUsers.value.length) {
                typingUsers.value = newTypingUsers;
            }
        }, 1000);
        return (() => {
            clearInterval(typingInterval);
        })
    }, []);

    if (typingUsers.value.length == 0) return <div id="typing" />

    const multipleTypers = typingUsers.value.length > 1;
    const userNames = typingUsers.value.length > 2 ? "Several people" : typingUsers.value.map((user) => user.username).join(', ');
    return (
        <div id="typing">
            {userNames} {multipleTypers ? 'are ' : 'is '}
            <div className="typingWrapper">
                typing
                <div className="loadingDotsWrapper">
                    <div className="loadingDots"></div>
                </div>
            </div>
        </div>
    );
}

export const ChatInput = ({ historyMode }) => {
    const { sendMessage, permissions, authorization, viewPort } = useContext(WebSocketContext);

    const lastTypingEvent = useRef(Date.now());
    const sendFile = useSignal(null);
    const currentScreenshot = useSignal(null);
    const refImageUploadFile = useRef();

    const chatBoxEmpty = useSignal(true);
    const text = useSignal("");
    const inputRef = useRef();


    useEffect(() => {
        resizeChat();
    }, [text.value]);
    
    const resizeChat = () => {
        if (inputRef.current) {
            var ta = inputRef.current;
            let oldHeight = ta.style.height;
            ta.style.height = '0px';
            var height = Math.min(18 * 5, ta.scrollHeight);
            ta.style.height = height + 'px';
            if (oldHeight != height) {
                if (!historyMode.value) {
                    var messages = document.getElementById("messages");
                    if (messages) messages.scrollTop = messages.scrollHeight;
                }
            }
        }
    }


    const handleKeypress = (e) => {
        var enterKeycode = 13;
        if (e.which == enterKeycode && !e.shiftKey) {
            e.preventDefault();
            if (text.value.trim() != "") {
                sendMessage({
                    action: 'chatmessage',
                    type: "text",
                    message: text.value
                });
                batch(()=>{
                    text.value = '';
                    chatBoxEmpty.value = true;
                })
                resizeChat();
                sendMessage({
                    action: 'typing',
                    state: 'stop'
                });
            }
        }
    }

    const handleOnInput = (e) => {
        if(authorization.value.anonymous && e.target.value.length > 250){
            e.target.value = e.target.value.slice(0,250);
        }
        batch(()=>{
            text.value = e.target.value;
            chatBoxEmpty.value = e.target.value.length == 0
        })
        
        var now = Date.now();
        if (now - lastTypingEvent.current > 1000) {
            sendMessage({
                action: 'typing',
                state: 'start'
            });
            lastTypingEvent.current = now;
        }
    };



    const openConfirmWindow = (e) => {
        sendFile.value = { file: e.target.files[0] };
    }

    const chatPaste = useCallback((e) => {
        if (!(permissions.value.imagePermission)) return;
        if (e.clipboardData) {
            var items = e.clipboardData.items
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") == -1) continue
                var blob = items[i].getAsFile();
                sendFile.value = { file: blob };
            }
        };
    }, [])


    const screenshot = () => {
        let canvas = document.createElement('canvas');
        let video = document.getElementById('video');

        canvas.width = viewPort.value.width;
        canvas.height = viewPort.value.height;

        let ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let image = canvas.toDataURL('image/png');

        currentScreenshot.value = image;
    }

    const focusChat = () => {
        if (inputRef.current) inputRef.current.focus();
    }

    return <Fragment>
        {currentScreenshot.value && <ScreenshotModal sendFile={sendFile} currentScreenshot={currentScreenshot} ></ScreenshotModal>}
        <ConfirmUpload sendFile={sendFile} />
        <div id="chatbox" onclick={focusChat}>
            <div class={`image-uploader ${chatBoxEmpty.value ? "" : "hasText"}`}>
                <div class="ta-wrapper">
                    <textarea id="chat-textbox"
                        ref={inputRef}
                        value={text}
                        class="chatbox-textarea"
                        onKeyPress={handleKeypress}
                        onInput={handleOnInput}
                        onPaste={chatPaste}>
                    </textarea>
                </div>
                {permissions.value.imagePermission && chatBoxEmpty.value &&
                    <div class="image-uploader-button-wrapper">
                        <input id="image-upload-file" type="file" name="image" accept="image/png, image/jpeg, image/gif, video/webm,  image/webp, video/mp4" onchange={openConfirmWindow} ref={refImageUploadFile} />
                        <img class="image-uploader-button" src="/svg/screen_shot.svg" onclick={screenshot} />
                        <img class="image-uploader-button" src="/svg/imageupload.svg" onclick={() => refImageUploadFile.current.click()} />
                    </div>
                }
            </div>
            <TypingBox />
        </div>
    </Fragment>
}
