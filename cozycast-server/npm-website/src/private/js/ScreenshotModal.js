import { h } from 'preact'
import Cropper from 'cropperjs';
import { useEffect, useRef } from 'preact/hooks';

export const ScreenshotModal = ({ sendFile, currentScreenshot }) => {

    const cropper = useRef(null);

    const closeModal = () => {
        removeCropper();
        currentScreenshot.value = false;
    }

    const backgroundDiv = useRef();
    const currentImage = useRef();

    useEffect(() => {
        backgroundDiv.current.focus();
        if (!cropper.current) {
            cropper.current = new Cropper(currentImage.current, { zoomable: false, autoCropArea: 0.3 });
        }
        return () => {
            removeCropper()
        }
    }, [])

    const removeCropper = () => {
        if (cropper.current) {
            cropper.current.destroy();
            cropper.current = null;
        }
    }

    const selectCrop = () => {
        cropper.current.getCroppedCanvas().toBlob((blob) => {
            sendFile.value = {file: blob, screenshot: true};
        })
    }


    return <div class="modal-background" style={{ 'background-color': 'rgba(0, 0, 0, 0.93)' }} tabindex="0" ref={backgroundDiv} onkeydown={(e) => { if (e.key === "Escape") { closeModal() } }}>
        <div class="imageModal" style={{ 'max-width': '80vw' }}>
            <div class="screenshotBorder">
                <img style={{ display: "block", 'max-width': '100%' }} ref={currentImage} src={currentScreenshot.value} />
            </div>
            <div class="confirmButton">
                <button type="button" onclick={selectCrop} class="btn btn-danger buttonBorder">Crop</button>
                <button type="button" onclick={closeModal} class="btn buttonCancel buttonBorder">Close</button>
            </div>
        </div>
    </div>
}
