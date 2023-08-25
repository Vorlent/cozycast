import { h } from 'preact'

export const ImageModal = ({ imageInfo }) => {

    const closeModal = () => {
        imageInfo.value = {};
    }
    if(!(imageInfo.value.display )) return;
    
    return <div class="modal-background" onclick={closeModal}>
        <div class="imageModal">
            {imageInfo.value.type == "image" &&
                <div>
                    <a class="chat-link" target="_blank" href={imageInfo.value.href}><img src={imageInfo.value.href} /></a>
                </div>
            }
            {imageInfo.value.type == "video" &&
                <div>
                    <a class="chat-link" target="_blank" href={imageInfo.value.href}> <video loop autoplay controls src={imageInfo.value.href} /></a>
                </div>
            }
        </div>
    </div>
}
