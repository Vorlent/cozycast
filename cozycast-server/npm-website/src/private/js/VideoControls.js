import { h } from 'preact'
import { useContext, useEffect, useRef } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext';
import { WebSocketContext } from './websocket/WebSocketContext';

var lastMouseEvent = Date.now();

function disableContextmenu(e) {
    e.preventDefault();
    return false;
}



export const VideoControls = () => {
    const { volume, muted } = useContext(AppStateContext);
    const { remoteInfo, videoPaused, videoLoading, toggleVideo, sendMessage, viewPort } = useContext(WebSocketContext);
    const videoElementRef = useRef();
    
    useEffect(() => {
        updateVolume();
    }, [volume.value,muted.value])

    const getRemotePosition = (e) => {
        if (!videoElementRef.current || videoElementRef.current.videoWidth == 0 || videoElementRef.current.videoHeight == 0) {
            return { x: 0, y: 0 }
        }

        let xPosition = 0;
        let yPosition = 0;
        if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
            var touch = e.touches[0] || e.changedTouches[0];
            xPosition = touch.pageX;
            yPosition = touch.pageY;
        } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
            xPosition = e.clientX;
            yPosition = e.clientY;
        }

        var videoRect = videoElementRef.current.getBoundingClientRect();
        var ratioDistortion = (videoRect.width / videoRect.height) / (videoElementRef.current.videoWidth / videoElementRef.current.videoHeight);
        var wider = (ratioDistortion > 1);
        // assume centered
        var padVt = wider ? 0 : (videoRect.height * (1 - ratioDistortion) / 2);
        var padHz = wider ? (videoRect.width * (1 - 1 / ratioDistortion)) / 2 : 0;
        var correctedRect = { // video rectangle with corrections for black lines
            top: videoRect.top + padVt,
            right: videoRect.right - padHz,
            bottom: videoRect.bottom - padVt,
            left: videoRect.left + padHz
        };
        var x = (xPosition- correctedRect.left) / (correctedRect.right - correctedRect.left) * viewPort.value.width;
        var y = (yPosition - correctedRect.top) / (correctedRect.bottom - correctedRect.top) * viewPort.value.height;
        return { x: x, y: y }
    }

    const videoMouseUp = (e) => {
        if (!remoteInfo.value.remote) { return }
        var pos = getRemotePosition(e);
        sendMessage({
            action: 'mouseup',
            mouseX: pos.x,
            mouseY: pos.y,
            button: e.button
        });
    }

    const videoMouseDown = (e) => {
        if (videoPaused.value) {
            toggleVideo();
            return;
        }
        if (!remoteInfo.value.remote) { return }

        var pos = getRemotePosition(e);
        sendMessage({
            action: 'mousedown',
            mouseX: pos.x,
            mouseY: pos.y,
            button: e.button
        });
    }

    const videoMousemove = (e) => {
        if (!remoteInfo.value.remote) { return }
        var now = Date.now();
        if (now - lastMouseEvent > 10) {
            var pos = getRemotePosition(e);
            sendMessage({
                action: 'mousemove',
                mouseX: pos.x,
                mouseY: pos.y
            });
            lastMouseEvent = now;
        }
    }

    const videoScroll = (e) => {
        if (!remoteInfo.value.remote) { return }
        if (e.deltaY < 0) {
            sendMessage({
                action: 'scroll',
                direction: "up"
            });
        }
        if (e.deltaY > 0) {
            sendMessage({
                action: 'scroll',
                direction: "down"
            });
        }
    }

    const videoKeyUp = (e) => {
        if (!remoteInfo.value.remote) { return }
        if (e.ctrlKey && e.key.toLowerCase() == "v") {
            return;
        }
        e.preventDefault();
        sendMessage({
            action: 'keyup',
            key: e.key
        });
    }

    const videoKeyDown = (e) => {
        if (!remoteInfo.value.remote) { return }
        if (e.ctrlKey && e.key.toLowerCase() == "v") {
            return;
        }
        e.preventDefault();
        sendMessage({
            action: 'keydown',
            key: e.key
        });
    }

    const paste = (e) => {
        if (!remoteInfo.value.remote) { return }
        e.preventDefault();
        var pastedData = e.clipboardData.getData('text');
        sendMessage({
            action: 'paste',
            clipboard: pastedData
        });
    }

    const autoplayDetected = (loadingState) => {
        videoPaused.value = false;
    }

    const onCanPlay = (e) => {
        videoLoading.value = "loaded";
        updateVolume();
    }

    const onLoadStart = (e) => {
        videoLoading.value = "loading";
    }

    const updateVolume = () => {
        if (videoElementRef.current) {
            if (muted.value) videoElementRef.current.volume = 0;
            else { videoElementRef.current.volume = volume.value / 100; }
        }
    }

    return (<div id="videoBig">
        <div id="videocontrols" tabindex="-1"
            oncontextmenu={disableContextmenu}
            onmousemove={videoMousemove}
            onmouseup={videoMouseUp}
            onmousedown={videoMouseDown}
            onpaste={paste}
            onkeyup={videoKeyUp}
            onkeydown={videoKeyDown}
            onwheel={videoScroll}

            onTouchStart={videoMouseDown}
            onTouchEnd={videoMouseUp}
            onTouchMove={videoMousemove}
        >
            {videoPaused.value &&
                <div class="paused-screen">
                    <div class="play-button"><img title="Play" src="/svg/initial_play_button.svg" /></div>
                </div>}
            { videoLoading.value == "loading" && !videoPaused.value &&
                <div class="paused-screen">
                    <div class="loading-screen">
                        <img src="/svg/loading-cozy.svg" />
                        LOADING...
                    </div>
                </div>
            }
        </div>
        <audio id="autoplay" controls="" volume="0" src="/audio/pop.wav" autoplay
            preload="auto" onplay={e => autoplayDetected(false)} />
        <div id="videosizer">
            <video id="video" 
                ref={videoElementRef}
                autoplay 
                tabindex="-1"
                oncanplay={e => onCanPlay(e)}
                onloadstart={e => onLoadStart(e)}
            ></video>
        </div>
    </div>
    );
}
