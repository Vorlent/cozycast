import { h } from 'preact'
import { useContext } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext';

export const MobileRemoteControls = ({ lastRemotePosition, onPaste, onKeyUp, onKeyDown }) => {
    const { remoteInfo, sendMessage } = useContext(WebSocketContext);

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
        e.preventDefault();

        let key;

        switch (e.inputType) {
            case 'insertText':
                key = e.data;
                if (key.length > 1) {
                    sendMessage({
                        action: 'paste',
                        clipboard: key
                    });
                    return;
                }
                break;
            case 'deleteContentBackward':
                key = 'Backspace';
                break;
            case 'deleteContentForward':
                key = 'Delete';
                break;
            case 'insertLineBreak':
                key = 'Enter';
            default:
                return;
        }

        sendMessage({
            action: 'keydown',
            key: key
        });
        sendMessage({
            action: 'keyup',
            key: key
        });

        e.target.value = ''; // Clear the input field
    }


    const handleKeyDown = (e) => {
        if (!remoteInfo.value.remote) { return }
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage({
                action: 'keydown',
                key: 'Enter'
            });
            sendMessage({
                action: 'keyup',
                key: 'Enter'
            });
            e.target.value = '';
        }
    }


    if (!remoteInfo.value.remote) return;

    return (
        <div className="touchpad-controls">
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
            <div class="textarea-wrapper">
                <textarea autocomplete="off" autocorrect="off" spellcheck="false" autocapitalize="off" className="click-button keyboard-input"
                    onKeyDown={handleKeyDown}
                    onBeforeInput={handleInput} />
                <img src="/svg/keyboard.svg" class="textarea-icon" />
            </div>

        </div>
    );
};