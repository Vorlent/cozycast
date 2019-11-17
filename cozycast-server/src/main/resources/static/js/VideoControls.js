import { html, Component } from '/js/libs/preact.standalone.module.js'

import { state, updateState, sendMessage } from '/js/index.js'

var lastMouseEvent = Date.now();
var resolutionX = 1280;
var resolutionY = 720;

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
    var x = (e.clientX - correctedRect.left) / (correctedRect.right - correctedRect.left) * resolutionX;
    var y = (e.clientY - correctedRect.top) / (correctedRect.bottom - correctedRect.top) * resolutionY;
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
    if(!state.remote) { return }
    var videoElement = document.getElementById('video');
    if(videoElement.paused) {
        videoElement.play();
        videoLoadingScreen(true)
    }

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

function videoLoadingScreen(loadingState) {
    updateState(function (state) {
        state.videoPaused = false;
        state.videoLoading = loadingState;
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
                  <div class="play-button">Play</div>
              </div>`}
              ${state.videoLoading &&
                  html`<div class="paused-screen">
                  <div class="loading-screen">
                      <img class="loading-animation" src="svg/loading.svg"/>
                      LOADING...
                  </div>
              </div>`}
            </div>
            <div id="videosizer">
              <video id="video" autoplay tabindex="0"
                  onplay=${e => videoLoadingScreen(false)}
                  onloadstart=${e => videoLoadingScreen(true)}
              ></video>
            </div>
        </div>`
    }
}
