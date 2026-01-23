import { h, Fragment } from 'preact'
import { useContext, useEffect, useRef } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext';
import { WebSocketContext } from './websocket/WebSocketContext';
import { MobileRemoteControls } from './MobileRemoteControls.js'

var lastMouseEvent = Date.now();

function disableContextmenu(e) {
    e.preventDefault();
    return false;
}



export const VideoControls = () => {
    const { volume, muted } = useContext(AppStateContext);
    const { audioOnly, remoteInfo, videoPaused, videoLoading, toggleVideo, sendMessage, viewPort } = useContext(WebSocketContext);
    const videoElementRef = useRef();
    const videocontrols = useRef();

    useEffect(() => {
        updateVolume();
    }, [volume.value, muted.value])

    useEffect(() => {
        lastRemotePosition.current = { x: viewPort.value.width / 2, y: viewPort.value.height / 2 }
    }, [viewPort.value])

    const lastRemotePosition = useRef({ x: 0, y: 0 });
    const getRemotePosition = (e) => {
        if (!videoElementRef.current || videoElementRef.current.videoWidth == 0 || videoElementRef.current.videoHeight == 0) {
            return { x: 0, y: 0 }
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
        var x = (e.clientX - correctedRect.left) / (correctedRect.right - correctedRect.left) * viewPort.value.width;
        var y = (e.clientY - correctedRect.top) / (correctedRect.bottom - correctedRect.top) * viewPort.value.height;
        lastRemotePosition.current = { x: x, y: y };
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

    const trackedTouchIdentifier = useRef(null);
    const lastTouchPosition = useRef({ x: 0, y: 0 });
    const setTouchPosition = (e) => {
        if (!remoteInfo.value.remote) { return }
        try {
            e.preventDefault();
        } catch (error) {
            console.error("Error: " + error.message);
        }
        let touch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].target === videocontrols.current) {
                touch = e.touches[i];
                break;
            }
        }

        // If no touch event is occurring on the div, return
        if (touch === null) {
            return;
        }

        trackedTouchIdentifier.current = touch.identifier;
        const xNew = touch.pageX;
        const yNew = touch.pageY;
        lastTouchPosition.current = { x: xNew, y: yNew };
    }

    const videoTouchmove = (e) => {
        if (!remoteInfo.value.remote) { return }
        try {
            e.preventDefault();
        } catch (error) {
            console.error("Error: " + error.message);
        }
        var now = Date.now();
        if (now - lastMouseEvent > 10) {
            var touch = null;
            // Find the touch with the matching identifier
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === trackedTouchIdentifier.current) {
                    touch = e.touches[i] || e.changedTouches[i];
                    break;
                }
            }

            if (touch === null) {
                return;
            }

            const xNew = touch.pageX;
            const yNew = touch.pageY;
            const { x: xOld, y: yOld } = lastTouchPosition.current;
            lastTouchPosition.current = { x: xNew, y: yNew };

            const { x: remPosX, y: remPosY } = lastRemotePosition.current;
            let newX = remPosX + (xNew - xOld);
            let newY = remPosY + (yNew - yOld);
            newX = Math.max(0, Math.min(newX, viewPort.value.width));
            newY = Math.max(0, Math.min(newY, viewPort.value.height));
            lastRemotePosition.current = { x: newX, y: newY };
            sendMessage({
                action: 'mousemove',
                mouseX: newX,
                mouseY: newY
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

    return (
        <div class="videoAndControlsWrapper">
            <div id="videoBig">
                <div id="videocontrols" tabindex="-1"
                    oncontextmenu={disableContextmenu}
                    onmousemove={videoMousemove}
                    onmouseup={videoMouseUp}
                    onmousedown={videoMouseDown}
                    onpaste={paste}
                    onkeyup={videoKeyUp}
                    onkeydown={videoKeyDown}
                    onwheel={videoScroll}

                    onTouchStart={setTouchPosition}
                    onTouchMove={videoTouchmove}

                    ref={videocontrols}
                >
                    {/* State 1: Paused */}
                    {videoPaused.value &&
                        <div class="paused-screen">
                            <div class="play-button"><img title="Play" src="/svg/initial_play_button.svg" /></div>
                        </div>}

                    {/* State 2: Loading (but not paused) */}
                    {videoLoading.value == "loading" && !videoPaused.value &&
                        <div class="paused-screen">
                            <div class="loading-screen">
                                <img src="/svg/loading-cozy.svg" />
                                LOADING...
                            </div>
                        </div>
                    }

                    {/* State 3: Audio Only (Running, not loading, no video) */}
                    {audioOnly.value && !videoPaused.value && videoLoading.value !== "loading" &&
                        <div class="audio-only-indicator">
                            <div class="audio-content">
                                <img src="/svg/volume-up.svg" alt="Audio Only" />
                                <span>Audio Only Stream Running</span>
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
            <MobileRemoteControls
                onKeyDown={videoKeyDown}
                onKeyUp={videoKeyUp}
                onPaste={paste}
                lastRemotePosition={lastRemotePosition} />
        </div>
    );
}
