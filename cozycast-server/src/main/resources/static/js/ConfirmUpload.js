import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'


export class ConfirmUpload extends Component {
    send =() => {
        if(this.props.pasteFile){
            this.pasteFile();
            return;
        }
    
        let e = this.props.sendFile;
        if(e.target.files.length > 0) {
            let formData = new FormData();
            formData.append("image", e.target.files[0]);
            fetch('/image/upload', {method: "POST", body: formData}).then((e) =>
                {if(e.status == 413){return Promise.reject("File is too large");};
                    e.json().then((e) => {
                        this.props.sendMessage({
                            action: 'chatmessage',
                            image: e.url,
                            type: e.type,
                            message: ""
                        });
                    })}).catch(error => {alert("Failed to post: " + error)});
            e.target.value = "";
            this.closeConfirmWindow();
        }
        else{this.closeConfirmWindow();}
    };
    
    lastUpload = Date.now()
    
    pasteFile = (e) => {
        var blob = this.props.pasteFile;
    
        var now = Date.now();
        if(now - this.lastUpload < 3000) {
            this.closeConfirmWindow();
            return;
        }
        this.lastUpload = now
    
        let formData = new FormData();
        formData.append("image", blob);
        fetch('/image/upload', {method: "POST", body: formData}).then((e) =>
            {if(e.status == 413){return Promise.reject("File is too large");};
                e.json().then((e) => {
                    this.props.sendMessage({
                        action: 'chatmessage',
                        image: e.url,
                        type: e.type,
                        message: ""
                    });
                })}).catch(error => {alert("Failed to post: " + error)});
        this.closeConfirmWindow();
    }
        
    closeConfirmWindow = () => {
        this.props.clear();
    }

    shouldComponentUpdate(nextProps, nextState){
        return nextProps.sendFile != this.props.sendFile || nextProps.pasteFile != this.props.pasteFile;
    }

    render({sendFile, pasteFile }, { xyz = [] }) {
        return html`${(sendFile || pasteFile) && html`
        <div class="confirmUpload">
            ${sendFile && html`
            ${sendFile.target.files[0].type.substring(0,5) == "image" &&
                html`<img src="${URL.createObjectURL(sendFile.target.files[0])}" class="uploadPreview"/>`}
            ${sendFile.target.files[0].type.substring(0,5) == "video" &&
                html`<video loop autoplay muted src="${URL.createObjectURL(sendFile.target.files[0])}" class="uploadPreview"/>`}
            `}
            ${pasteFile && html`
                <img src="${URL.createObjectURL(pasteFile)}" class="uploadPreview"/>
            `}
            <p>Upload this file?</p>
            <div class="confirmButton">
            <button type="button" onclick=${this.send} class="btn btn-danger buttonBorder">Upload</button>
            <button type="button" onclick=${this.closeConfirmWindow} class="btn buttonCancel buttonBorder">Cancel</button>
            </div>
        </div>
            `}`;
            
    }
}