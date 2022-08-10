import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

var lastMouseEvent = Date.now();

function disableContextmenu(e) {
    e.preventDefault();
    return false;
}

var videoElement;


export class VideoControls extends Component {

    getRemotePosition = (e) => {
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
        var x = (e.clientX - correctedRect.left) / (correctedRect.right - correctedRect.left) * this.props.state.viewPort.width;
        var y = (e.clientY - correctedRect.top) / (correctedRect.bottom - correctedRect.top) * this.props.state.viewPort.height;
        return { x: x, y: y }
    }
    
    videoMouseUp = (e) => {
        if(!this.props.state.remote) { return }
        var pos = this.getRemotePosition(e);
        this.props.sendMessage({
            action : 'mouseup',
            mouseX: pos.x,
            mouseY: pos.y,
            button: e.button
        });
    }
    
    videoMouseDown = (e) => {
        var videoElement = document.getElementById('video');
        if(this.props.state.videoPaused) {
            videoElement.play();
            this.props.pauseVideo();
            if (this.props.state.videoLoading != "loaded"){
                this.props.updateRoomState({
                    videoLoading: "loading"
                })
            }
        }
        if(!this.props.state.remote) { return }
    
        var pos = this.getRemotePosition(e);
        this.props.sendMessage({
            action : 'mousedown',
            mouseX: pos.x,
            mouseY: pos.y,
            button: e.button
        });
    }
    
    videoMousemove = (e) => {
        if(!this.props.state.remote) { return }
        var now = Date.now();
        if(now - lastMouseEvent > 10) {
            var pos = this.getRemotePosition(e);
            this.props.sendMessage({
                action : 'mousemove',
                mouseX: pos.x,
                mouseY: pos.y
            });
            lastMouseEvent = now;
        }
    }
    
    videoScroll = (e) => {
        if(!this.props.state.remote) { return }
        if(e.deltaY < 0) {
            this.props.sendMessage({
                action : 'scroll',
                direction: "up"
            });
        }
        if(e.deltaY > 0) {
            this.props.sendMessage({
                action : 'scroll',
                direction: "down"
            });
        }
    }
    
    videoKeyUp = (e) => {
        if(!this.props.state.remote) { return }
        if(e.ctrlKey && e.key.toLowerCase() == "v") {
            return;
        }
        e.preventDefault();
        this.props.sendMessage({
            action : 'keyup',
            key: e.key
        });
    }
    
    videoKeyDown = (e) => {
        if(!this.props.state.remote) { return }
        if(e.ctrlKey && e.key.toLowerCase() == "v") {
            return;
        }
        e.preventDefault();
        this.props.sendMessage({
            action : 'keydown',
            key: e.key
        });
    }
    
    paste = (e) => {
        if(!this.props.state.remote) { return }
        e.preventDefault();
        var pastedData = e.clipboardData.getData('text');
        this.props.sendMessage({
            action : 'paste',
            clipboard: pastedData
        });
    }
    
    autoplayDetected = (loadingState) => {
        this.props.updateRoomState({
            videoPaused: false
        })
    }
    
    onCanPlay = (e) => {
        this.props.updateRoomState({
            videoLoading: "loaded"
        })
    }
    
    onLoadStart = (e) => {
        this.props.updateRoomState({
            videoLoading: "loading"
        })
    }

    componentDidMount() {
        videoElement = document.getElementById('video');
        this.updateVolume(this.props.state.volume,this.props.state.muted);
    }

    shouldComponentUpdate(nextProps, nextState){
        return this.props.state.volume !== nextProps.state.volume || 
        this.props.state.muted !== nextProps.state.muted ||
        this.props.state.videoPaused !== nextProps.state.videoPaused ||
        this.props.state.videoLoading !== nextProps.state.videoLoading;
    }

    componentDidUpdate() {
    	this.updateVolume(this.props.state.volume,this.props.state.muted);
    }

    updateVolume(volume,muted) {
        if(document.getElementById('video')) {
            if(muted) document.getElementById('video').volume = 0;
            else {document.getElementById('video').volume = volume/100;}
        }
    }

    render({ state }, { xyz = [] }) {
        return html`<div id="videoBig" class="${state.scheduleSidebar ? 'hidden': ''}">
            <div id="videocontrols" tabindex="0"
              oncontextmenu=${disableContextmenu}
              onmousemove=${this.videoMousemove}
              onmouseup=${this.videoMouseUp}
              onmousedown=${this.videoMouseDown}
              onpaste=${this.paste}
              onkeyup=${this.videoKeyUp}
              onkeydown=${this.videoKeyDown}
              onwheel=${this.videoScroll}
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
                preload="auto" onplay=${e => this.autoplayDetected(false)}/>
            <div id="videosizer">
              <video id="video" autoplay tabindex="0"
                  oncanplay=${e => this.onCanPlay(e)}
                  onloadstart=${e => this.onLoadStart(e)}
              ></video>
            </div>
        </div>`
    }
}
