import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState } from '/js/index.js'
import { sendMessage } from '/js/Room.js'


function send() {
    if(state.pasteFile){
        pasteFile();
        return;
    }

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
};

var lastUpload = Date.now()

function pasteFile(e) {
    var blob = state.pasteFile;

    var now = Date.now();
    if(now - lastUpload < 3000) {
        closeConfirmWindow();
        return;
    }
    lastUpload = now

    let formData = new FormData();
    formData.append("image", blob);
    fetch('/image/upload', {method: "POST", body: formData}).then((e) => e.json()).then(function (e) {
        sendMessage({
            action: 'chatmessage',
            image: e.url,
            type: e.type,
            message: "",
            username: state.username
        });
    });
    closeConfirmWindow();
}

function cancel() {
    if(state.sendFile) state.sendFile.target.value = "";
    closeConfirmWindow();
}

export function openConfirmWindow(e) {
    updateState(function (state) {
        state.sendFile = e;
    })
}

export function openConfirmWindowPaste(e) {
    if(e.clipboardData) {
        var items = e.clipboardData.items
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") == -1) continue
            var blob = items[i].getAsFile()
            updateState(function (state) {
                state.pasteFile = blob;
            })
       }
    };

}

function closeConfirmWindow() {
    updateState(function (state) {
        delete state.sendFile;
        delete state.pasteFile;
    })
}

export class ConfirmUpload extends Component {
    render({state }, { xyz = [] }) {
        return html`${(state.sendFile || state.pasteFile) && html`
        <div class="confirmUpload">
            ${state.sendFile && html`
            ${state.sendFile.target.files[0].type.substring(0,5) == "image" &&
                html`<img src="${URL.createObjectURL(state.sendFile.target.files[0])}" class="uploadPreview"/>`}
            ${state.sendFile.target.files[0].type.substring(0,5) == "video" &&
                html`<video loop autoplay muted src="${URL.createObjectURL(state.sendFile.target.files[0])}" class="uploadPreview"/>`}
            `}
            ${state.pasteFile && html`
                <img src="${URL.createObjectURL(state.pasteFile)}" class="uploadPreview"/>
            `}
            <p>Upload this file?</p>
            <div class="confirmButton">
            <button type="button" onclick=${send} class="btn btn-danger buttonBorder">Send</button>
            <button type="button" onclick=${cancel} class="btn buttonCancel buttonBorder">Cancel</button>
            </div>
        </div>
            `}`;
            
    }
}