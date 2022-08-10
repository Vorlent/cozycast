import { Component } from '/js/libs/preact.js'
import { Button } from '/js/Button.js'
import { RemoteIcon } from '/js/RemoteIcon.js'
import { html } from '/js/libs/htm/preact/index.js'
import { SidebarState } from '/js/index.js'
import { removeCursor } from '/js/Room.js'

export class Controls extends Component {
    constructor(props){
        super(props);
        this.state = {
            volume: props.volume,
            muted: props.muted}
    }

    changeVolume = (e) => {
        if(e.target.value == 0){
            this.mute();
        }
        else{
            if(this.props.state.muted){
                this.toggleMute()
            }
            localStorage.setItem("volume",e.target.value);
            this.props.updateRoomState({volume: e.target.value})
        }
    }
    
    mute = () => {
        if(!this.props.state.muted){
            document.getElementById("volumeControl").value = 0;
            this.toggleMute()
        }
        else {
            document.getElementById("volumeControl").value = this.props.state.volume;
            this.toggleMute()
        }
    }
    
    toggleMute = () => {
        let updatedMuted = !this.props.state.muted;
        localStorage.setItem("muted",updatedMuted);
        if(this.props.state.showIfMuted) {
            this.props.sendMessage({
                action : 'userMuted',
                muted: updatedMuted || this.props.state.videoPaused
            });
        }
        this.props.updateRoomState({muted: updatedMuted})
    }

    
    pauseVideo = (e) => {
        let updatedPaused = !this.props.state.videoPaused;
        if(updatedPaused) {
            var videoElement = document.getElementById('video');
            videoElement.pause();
            this.props.stopVideo();
        } else {
            var videoElement = document.getElementById('video');
            videoElement.play();
            this.props.startVideo();
        }
        if(this.props.state.showIfMuted) {
            this.props.sendMessage({
                action : 'userMuted',
                muted: this.props.state.muted || updatedPaused
            });
        }
        this.props.updateRoomState({videoPaused: updatedPaused})
    }

    toggleRoomSettings = () => {
        if(this.props.state.roomSidebar != SidebarState.SETTINGS) {
            this.props.updateRoomState({roomSidebar: SidebarState.SETTINGS})
        } else {
            this.props.updateRoomState({roomSidebar: SidebarState.NOTHING})
        }
    }

    toggleUserSidebar = () => {
        if(this.props.state.roomSidebar != SidebarState.USERS) {
            this.props.updateRoomState({roomSidebar: SidebarState.USERS})
        } else {
            this.props.updateRoomState({roomSidebar: SidebarState.NOTHING})
        }
    }

    toggleChatSidebar = () => {
        if(this.props.state.roomSidebar != SidebarState.CHAT) {
            this.props.updateRoomState({roomSidebar: SidebarState.CHAT})
        } else {
            this.props.updateRoomState({roomSidebar: SidebarState.NOTHING})
        }
    }

    hideUserlist = () => {
        this.props.updateRoomState({userlistHidden: !this.props.state.userlistHidden});
    }

    toggleSchedule = () => {
        this.props.updateRoomState({scheduleSidebar: !this.props.state.scheduleSidebar});
    }

    toggleFullscreen = () => {
        if(document.fullscreenElement != null) {
            document.exitFullscreen()
        } else {
            document.getElementById("pagecontent").requestFullscreen()
            document.getElementById("pagecontent").addEventListener('mousemove',removeCursor);
        }
    }

    dropRemoteAndCenter = () => {
        if(this.props.state.remote) {
            this.props.sendMessage({
                action :'drop_remote',
                center: true
            });
        } 
    }
    
    remote = () => {
        if(this.props.state.remote) {
            this.props.sendMessage({
                action : 'drop_remote'
            });
        } else {
            this.props.sendMessage({
                action : 'pickup_remote'
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        return this.props.state.userlistHidden !== nextProps.state.userlistHidden ||
        this.props.state.profileModal !== nextProps.state.profileModal ||
        this.props.state.remote !== nextProps.state.remote ||
        this.props.state.videoPaused !== nextProps.state.videoPaused ||
        this.props.state.fullscreen !== nextProps.state.fullscreen ||
        this.props.state.muted !== nextProps.state.muted ||
        this.props.state.volume !== nextProps.state.volume ||
        this.props.state.roomSidebar  !== nextProps.state.roomSidebar;
    }

    render({state, roomId}){
        return html`
            <div id="controls"  class="${state.fullscreen ? "controlsFullscreen" : "visibleControls" }">
                <div class="subControls">
                    ${!state.fullscreen && html`<${Button} enabled=${state.userlistHidden} onclick=${this.hideUserlist} 
                        title="${state.userlistHidden ? 'Show Users' : 'Hide Users'}" style="buttonSmall optional">
                        <img class="video-control-icon" src="${state.userlistOnLeft? state.userlistHidden ? '/svg/chevron-right.svg' : '/svg/chevron-left.svg' : state.userlistHidden ? '/svg/chevron-up.svg' : '/svg/chevron-down.svg'}"/>
                    <//>`}
                    <${Button} enabled=${state.profileModal} onclick=${() => this.props.updateRoomState({profileModal: true})} style="buttonBig">Profile<//>
                </div>
                <div class="subControls">
                    ${!state.fullscreen && html`
                    ${html`<${Button} enabled=${false} onclick=${this.dropRemoteAndCenter} 
                        title="Drop and center Remote" style="buttonSmall optional ${ state.remote ? "" :"remoteHidden"}">
                        <img class="video-control-icon" src="/svg/crosshair.svg"/>
                    <//>`}
                    <${Button} enabled=${state.remote} onclick=${this.remote} style="buttonSmall" title="remote">
                        <div class="video-control-icon">
                        <${RemoteIcon} enabled=${state.remoteUsed && false}/>
                        </div>
                    <//>
                    `}
                    <${Button} enabled=${state.videoPaused} onclick=${this.pauseVideo}
                        title="${state.videoPaused ? 'Pause' : 'Play'}" style="buttonSmall">
                        <img class="video-control-icon" src="${state.videoPaused ? '/svg/play_button.svg' : '/svg/pause_button.svg'}"/>
                    <//>
                    <${Button} enabled=${state.fullscreen}
                        title="Fullscreen" onclick=${this.toggleFullscreen} style="buttonSmall">
                        <img class="video-control-icon" src="/svg/fullscreen_button.svg"/>
                    <//>
                    <${Button} enabled=${state.muted} onclick=${this.mute}
                        title="${state.muted ? 'Unmute' : 'Mute'}" style="buttonSmall">
                        <img class="video-control-icon" src="${state.muted ? '/svg/sound-mute.svg' : '/svg/sound-max.svg'}"/>
                    <//>
                    <input id="volumeControl" type="range" min="0" max="100" class="volumeSlider buttonBig" oninput=${this.changeVolume}/>
                    ${html`<${Button}} style="buttonSmall optional remoteHidden"><//>`}
                </div>
                <div class="subControls">
                    ${state.roomToken
                    && html`<${Button} enabled=${state.roomSidebar == SidebarState.SETTINGS}
                            onclick=${e => this.toggleRoomSettings(this.props.state.roomId)} style="buttonSmall">
                            <img class="room-settings-icon" src="/png/settings.png"/>
                        <//>`}
                    <${Button} enabled=${state.roomSidebar == SidebarState.USERS}
                               onclick=${e => this.toggleUserSidebar()} style="buttonSmall optional">
                        <img class="video-control-icon" src="/svg/users.svg"/>
                    <//>
                    <${Button} enabled=${state.roomSidebar == SidebarState.CHAT}
                               onclick=${e => this.toggleChatSidebar()} style="buttonSmall optional">
                        <img class="video-control-icon" src="/svg/message-circle.svg"/>
                    <//>
                </div>
            </div>
        `
    }
}