import {  h } from 'preact'
import { ChatInput } from './ChatInput.js'
import ChatMessages from './ChatMessages.js';
import { ImageModal } from './ImageModal.js';
import { useSignal } from '@preact/signals';

export const Chat = () => {
    const historyMode = useSignal(false);
    const imageModal = useSignal({edit: false});
    const editInfo = useSignal({});

    return <div id="chat">
        <ImageModal 
            imageInfo={imageModal} />
        <ChatMessages 
            historyMode={historyMode} 
            imageModal={imageModal}
            editInfo={editInfo}/>
        <ChatInput
            historyMode={historyMode}
            editInfo={editInfo}
            />
    </div>
}
