import moment from 'moment';
import { Fragment, h } from 'preact';
import { ConfirmUpload } from './ConfirmUpload.js';
import { ScreenshotModal } from './ScreenshotModal.js';
import { useCallback, useContext, useEffect, useRef } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext.js';
import { useSignal } from '@preact/signals';
import { AutoResizingTextInput } from './AutoResizingTextInput.js';

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
    const { sendMessage, permissions, viewPort } = useContext(WebSocketContext);

    const lastTypingEvent = useRef(Date.now());
    const sendFile = useSignal(null);
    const chatBoxEmpty = useSignal(true);
    const currentScreenshot = useSignal(null);
    const inputRef = useRef();
    const refImageUploadFile = useRef();


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

    const onResize = useCallback(() => {
        if (!historyMode.value) {
            var messages = document.getElementById("messages");
            if (messages) messages.scrollTop = messages.scrollHeight;
        }
    })

    const chatInput = useCallback((e) => {
        var now = Date.now();
        if (now - lastTypingEvent.current > 1000) {
            sendMessage({
                action: 'typing',
                state: 'start'
            });
            lastTypingEvent.current = now;
        }
    }, [])

    const chatEnter = useCallback((e) => {
        if (e.target.value.trim() != "") {
            sendMessage({
                action: 'chatmessage',
                type: "text",
                message: e.target.value
            });
            chatBoxEmpty.value = true
            sendMessage({
                action: 'typing',
                state: 'stop'
            });
        }
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
                <AutoResizingTextInput
                    onInput={chatInput}
                    onEnter={chatEnter}
                    onPaste={chatPaste}
                    onResize={onResize}
                    chatBoxEmpty={chatBoxEmpty}
                    ref={inputRef} />
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
