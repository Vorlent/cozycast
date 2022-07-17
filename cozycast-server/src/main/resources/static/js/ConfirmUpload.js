import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState } from '/js/index.js'
import { sendMessage } from '/js/Room.js'


function send() {
    let e = state.sendFile;
    if(e.target.files.length > 0) {
        let formData = new FormData();
        formData.append("image", e.target.files[0]);
        fetch('/image/upload', {method: "POST", body: formData}).then((e) => e.json()).then(function (e) {
            sendMessage({
                action: 'chatmessage',
                image: e.url,
                type: e.type,
                message: "",
                username: state.username
            });
        });
        e.target.value = "";
        closeConfirmWindow();
    }
    else{closeConfirmWindow();}
}

function cancel() {
    state.sendFile.target.value = "";
    closeConfirmWindow();
}

export function openConfirmWindow(e) {
    console.log(e.target.files[0].type )
    updateState(function (state) {
        state.sendFile = e;
    })
}

function closeConfirmWindow() {
    updateState(function (state) {
        delete state.sendFile;
    })
}

export class ConfirmUpload extends Component {
    render({state }, { xyz = [] }) {
        return html`${state.sendFile && html`
        <div class="confirmUpload">
            ${state.sendFile.target.files[0].type.substring(0,5) == "image" &&
                html`<img src="${URL.createObjectURL(state.sendFile.target.files[0])}" class="uploadPreview"/>`}
            ${state.sendFile.target.files[0].type.substring(0,5) == "video" &&
                html`<video loop autoplay muted src="${URL.createObjectURL(state.sendFile.target.files[0])}" class="uploadPreview"/>`}
            <p>Upload this file?</p>
            <div class="confirmButton">
            <button type="button" onclick=${send} class="btn btn-danger buttonBorder">Send</button>
            <button type="button" onclick=${cancel} class="btn buttonCancel buttonBorder">Cancel</button>
            </div>
        </div>
            `}`;
            
    }
}