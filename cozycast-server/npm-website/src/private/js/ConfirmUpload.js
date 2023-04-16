import { h } from 'preact'
import { authFetch } from './Authentication';
import { useContext } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext';



export const ConfirmUpload = ({ sendFile, screenshot }) => {
    const { roomId } = useContext(WebSocketContext);

    const send = () => {
        let formData = new FormData();
        formData.append("room", roomId.value);
        formData.append("image", sendFile.value.file);
        authFetch('/image/upload', { method: "POST", body: formData }).then((e) => {
            if (e.status != 200) { return Promise.reject("File is too large"); };
        }).catch(error => { alert("Failed to upload image") });
        closeWindow();
    };

    const closeWindow = () => {
        sendFile.value = null;
    }

    return (sendFile.value) &&
        <div class={sendFile.value.screenshot ? "confirmUploadWrapperScreenshot" : "confirmUploadWrapper"}>
            <div class={`confirmUpload ${sendFile.value.screenshot ? "centerMode" : ""}`}>
                {(() => {
                    switch (sendFile.value.file.type.substring(0, 5)) {
                        case 'image':
                            return <img src={URL.createObjectURL(sendFile.value.file)} class="uploadPreview" />
                        case 'video':
                            return <video loop autoplay muted src={URL.createObjectURL(sendFile.value.file)} class="uploadPreview" />
                    }
                })()}
                <p>Upload this file?</p>
                <div class="confirmButton">
                    <button type="button" onclick={send} class="btn btn-danger buttonBorder">Upload</button>
                    <button type="button" onclick={closeWindow} class="btn buttonCancel buttonBorder">Cancel</button>
                </div>
            </div>
        </div>
        ;
}