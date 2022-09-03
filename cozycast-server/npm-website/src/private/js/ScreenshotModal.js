import { h, Component, createRef } from 'preact'
import Cropper from 'cropperjs';

export class ScreenshotModal extends Component {

    cropper = null;

    closeModal = () => {
        this.props.setChatState({screenshotModal: false})
        this.removeCropper();
    }

    shouldComponentUpdate(nextProps, nextState){
        return false;
    }

    backgroundDiv = createRef();
    currentImage = createRef();
    componentDidMount(){
        this.backgroundDiv.current.focus();
        if(!this.cropper) {
            this.cropper = new Cropper(this.currentImage.current, {zoomable: false, autoCropArea: 0.3});
        }
    }

    componentWillUnmount(){
        this.removeCropper();
    }

    removeCropper = () => {
        if(this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }

    selectCrop= () => {
        this.cropper.getCroppedCanvas().toBlob((blob) => {
            this.props.setChatState({pasteFile: blob})
        })
    }


    render({href}) {
        return <div class="modal-background" tabindex="0" ref={this.backgroundDiv} onkeydown={(e) => {if(e.key === "Escape"){ this.closeModal()} }}>
                <div class="imageModal" style={{'max-width': '80vw'}}>
                    <div>
                        <img style={{display: "block", 'max-width': '100%'}} ref={this.currentImage} src={href}/>
                    </div>
                    <br></br>
                    <div class="confirmButton">
                        <button type="button" onclick={this.selectCrop} class="btn btn-danger buttonBorder">Crop</button>
                        <button type="button" onclick={this.closeModal} class="btn buttonCancel buttonBorder">Close</button>
                    </div>
                </div>
            </div>
    }
}
