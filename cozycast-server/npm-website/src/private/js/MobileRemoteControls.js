import { h } from 'preact'
import { useContext, useRef } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext';
import { AppStateContext } from './appstate/AppStateContext';

export const MobileRemoteControls = ({ lastRemotePosition }) => {
    const { remoteInfo, sendMessage } = useContext(WebSocketContext);
    const { touchDevice } = useContext(AppStateContext);

    const videoMouseUp = (button) => {
        if (!remoteInfo.value.remote) { return }
        const { x, y } = lastRemotePosition.current;
        sendMessage({
            action: 'mouseup',
            mouseX: x,
            mouseY: y,
            button: button
        });
    }

    const videoMouseDown = (button) => {
        if (!remoteInfo.value.remote) { return }
        const { x, y } = lastRemotePosition.current;
        sendMessage({
            action: 'mousedown',
            mouseX: x,
            mouseY: y,
            button: button
        });
    }

    const videoScroll = (direction) => {
        if (!remoteInfo.value.remote) { return }
        sendMessage({
            action: 'scroll',
            direction: direction
        });
    }

    const handleInput = (e) => {
        if (!remoteInfo.value.remote) { return }
        let key = null;

        if (e.inputType == 'insertText') {
            key = e.data;
            e.target.value += key;
            if (key.length > 1) {
                e.preventDefault();
                sendMessage({
                    action: 'paste',
                    clipboard: key
                });
                return;
            }
        }
        else switch (e.inputType) {
            case 'deleteContentBackward':
                key = 'Backspace';
                break;
            case 'deleteContentForward':
                key = 'Delete';
                break;
            case 'insertLineBreak':
                key = 'Enter';
                break;
            default:
                return;
        }
        e.preventDefault();
        sendMessage({
            action: 'keydown',
            key: key
        });
        sendMessage({
            action: 'keyup',
            key: key
        });
    }

    //Backup for everything handleInput does not catch
    const handleKeyDown = (e) => {
        if (!remoteInfo.value.remote) { return }
        if(e.key && e.key != 'Unidentified'){
            e.preventDefault();
            if(e.key.length == 1) e.target.value += e.key;
            sendMessage({
                action: 'keydown',
                key: e.key
            });
            sendMessage({
                action: 'keyup',
                key: e.key 
            });
            if (e.key === 'Enter') {
                e.target.value = '';
            }
        }
    }

    const handleTextAreaClick = (e) => {
        e.preventDefault();
        // Check if textarea is focused
        if (document.activeElement === textareaRef.current) {
          // Unfocus the textarea
          textareaRef.current.blur();
        } else {
          // Focus the textarea
          textareaRef.current.focus();
        }
      }


    if (!remoteInfo.value.remote || !touchDevice.value ) return;

    const textareaRef = useRef();
    return (
        <div className="touchpad-controls">
            <div class="textarea-wrapper">
                <textarea autocomplete="off" autocorrect="off" spellcheck="false" autocapitalize="off" className="keyboard-input"
                    onKeyDown={handleKeyDown}
                    onBeforeInput={handleInput}
                    onTouchStart={handleTextAreaClick}
                    ref={textareaRef}/>
                <img src="/svg/keyboard.svg" class="textarea-icon" />
            </div>
            <button tabIndex="-1" className="click-button" onTouchStart={() => videoMouseDown(0)} onTouchEnd={() => videoMouseUp(0)} >
                <img src="/svg/left-click.svg" />
            </button>
            <button tabIndex="-1" className="click-button" onTouchStart={() => videoMouseDown(2)} onTouchEnd={() => videoMouseUp(2)}>
                <img src="/svg/right-click.svg" />
            </button>
            <button className="click-button scroll" onClick={() => videoScroll("up")}>
                <img src="/svg/arrow-up.svg" />
            </button>
            <button className="click-button scroll" onClick={() => videoScroll("down")}>
                <img src="/svg/arrow-down.svg" />
            </button>
        </div>
    );
};