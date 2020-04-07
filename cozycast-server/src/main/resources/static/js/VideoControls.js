import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { state, updateState } from '/js/index.js'
import { sendMessage, pauseVideo } from '/js/Room.js'

var lastMouseEvent = Date.now();

function disableContextmenu(e) {
    e.preventDefault();
    return false;
}

var videoElement;

function getRemotePosition(e) {
    if(!videoElement || videoElement.videoWidth == 0 || videoElement.videoHeight == 0) {
        return { x: 0, y: 0 }
    }
    var videoRect = videoElement.getBoundingClientRect();
    var ratioDistortion = (videoRect.width / videoRect.height) / (videoElement.videoWidth / videoElement.videoHeight);
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
    var x = (e.clientX - correctedRect.left) / (correctedRect.right - correctedRect.left) * state.viewPort.width;
    var y = (e.clientY - correctedRect.top) / (correctedRect.bottom - correctedRect.top) * state.viewPort.height;
    return { x: x, y: y }
}

function videoMouseUp(e) {
    if(!state.remote) { return }
    var pos = getRemotePosition(e);
    sendMessage({
    	action : 'mouseup',
    	mouseX: pos.x,
    	mouseY: pos.y,
    	button: e.button
    });
}

function videoMouseDown(e) {
    var videoElement = document.getElementById('video');
    if(state.videoPaused) {
        videoElement.play();
        updateState(function (state) {
            pauseVideo()
            if(state.videoLoading != "loaded") {
                state.videoLoading = "loading";
            }
        })
    }
    if(!state.remote) { return }

    var pos = getRemotePosition(e);
    sendMessage({
    	action : 'mousedown',
    	mouseX: pos.x,
    	mouseY: pos.y,
    	button: e.button
    });
}

function videoMousemove(e) {
    if(!state.remote) { return }
    var now = Date.now();
    if(now - lastMouseEvent > 10) {
    	var pos = getRemotePosition(e);
    	sendMessage({
    		action : 'mousemove',
    		mouseX: pos.x,
    		mouseY: pos.y
    	});
    	lastMouseEvent = now;
    }
}

function videoScroll(e) {
    if(!state.remote) { return }
    if(e.deltaY < 0) {
    	sendMessage({
    		action : 'scroll',
    		direction: "up"
    	});
    }
    if(e.deltaY > 0) {
    	sendMessage({
    		action : 'scroll',
    		direction: "down"
    	});
    }
}

function videoKeyUp(e) {
    if(!state.remote) { return }
    if(e.ctrlKey && e.key.toLowerCase() == "v") {
    	return;
    }
    e.preventDefault();
    sendMessage({
    	action : 'keyup',
    	key: e.key
    });
}

function videoKeyDown(e) {
    if(!state.remote) { return }
    if(e.ctrlKey && e.key.toLowerCase() == "v") {
    	return;
    }
    e.preventDefault();
    sendMessage({
    	action : 'keydown',
    	key: e.key
    });
}

function paste(e) {
    if(!state.remote) { return }
    e.preventDefault();
    var pastedData = e.clipboardData.getData('text');
    sendMessage({
    	action : 'paste',
    	clipboard: pastedData
    });
}

function autoplayDetected(loadingState) {
    updateState(function (state) {
        state.videoPaused = false;
    })
}

function onCanPlay(e) {
    updateState(function (state) {
        state.videoLoading = "loaded";
    })
}

function onLoadStart(e) {
    updateState(function (state) {
        state.videoLoading = "loading";
    })
}

export class VideoControls extends Component {

    componentDidMount() {
        videoElement = document.getElementById('video');
        this.updateVolume(this.props.state.volume);
    }

    componentDidUpdate() {
    	this.updateVolume(this.props.state.volume);
    }

    updateVolume(volume) {
        if(document.getElementById('video')) {
            document.getElementById('video').volume = volume/100;
        }
    }

    render({ state }, { xyz = [] }) {
        return html`<div id="videoBig">
            <div id="videocontrols" tabindex="0"
              oncontextmenu=${disableContextmenu}
              onmousemove=${videoMousemove}
              onmouseup=${videoMouseUp}
              onmousedown=${videoMouseDown}
              onpaste=${paste}
              onkeyup=${videoKeyUp}
              onkeydown=${videoKeyDown}
              onwheel=${videoScroll}
            >
              ${state.videoPaused &&
                html`<div class="paused-screen">
                  <div class="play-button"><img title="Play" src="/svg/initial_play_button.svg"/></div>
              </div>`}
              ${state.videoLoading == "loading" && !state.videoPaused &&
                  html`<div class="paused-screen">
                  <div class="loading-screen">
                      <img class="loading-animation" src="/svg/loading.svg"/>
                      LOADING...
                  </div>
              </div>`}
            </div>
            <audio id="autoplay" controls="" volume="0" src="/audio/pop.wav" autoplay
                preload="auto" onplay=${e => autoplayDetected(false)}/>
            <div id="videosizer">
              <video id="video" autoplay tabindex="0"
                  oncanplay=${e => onCanPlay(e)}
                  onloadstart=${e => onLoadStart(e)}
              ></video>
            </div>
        </div>`
    }
}
