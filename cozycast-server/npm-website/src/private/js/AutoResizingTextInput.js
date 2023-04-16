import { h } from 'preact'
import { useEffect } from 'preact/hooks';
import { forwardRef } from 'preact/compat';
import { useSignal } from '@preact/signals';

export const AutoResizingTextInput = forwardRef(({ onInput, onEnter, chatBoxEmpty, onPaste, onResize }, ref) => {
    const text = useSignal("");

    useEffect(() => {
        if (ref.current) {
            var ta = ref.current;
            let oldHeight = ta.style.height;
            ta.style.height = '0px';
            var height = Math.min(18 * 5, ta.scrollHeight);
            ta.style.height = height + 'px';
            if(oldHeight != height && onResize){
                onResize();
            }
        }
    }, [text.value]);

    useEffect(() => {
        if (chatBoxEmpty.value) text.value = '';
    }, [chatBoxEmpty.value])

    const handlePaste = (e) => {
        if (onPaste) {
            onPaste(e);
        }
    }

    const handleKeypress = (e) => {
        var enterKeycode = 13;
        if (e.which == enterKeycode && !e.shiftKey) {
            if (onEnter) {
                e.preventDefault();
                onEnter(e);
            }
        }
    }

    const handleOnInput = (e) => {
        if (e.target.value.length != 0) chatBoxEmpty.value = false
        else chatBoxEmpty.value = true

        text.value = e.target.value;
        if (onInput) {
            onInput(e);
        }
    };

    return (
        <div class="ta-wrapper">
            <textarea id="chat-textbox"
                ref={ref}
                value={text}
                class="chatbox-textarea"
                onKeyPress={handleKeypress}
                onInput={handleOnInput}
                onPaste={handlePaste}>
            </textarea>
        </div>
    );
});

