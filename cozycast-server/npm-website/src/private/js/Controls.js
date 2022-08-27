import { Component,Fragment,h } from 'preact'
import { Button } from './Button.js'
import { SidebarState } from './index.js'
import { removeCursor } from './Room.js'


import { RemoteIcon } from '../svg/RemoteIcon.js'

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
            this.toggleMute()
        }
        else {
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
            if(this.props.state.remote){
                this.props.sendMessage({
                    action : 'drop_remote'
                });
            }
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
        return <div id="controls"  class={state.fullscreen ? "controlsFullscreen" : "visibleControls" }>
                <div class="subControls">
                    <Button enabled={false} onclick={this.hideUserlist} 
                        title={state.userlistHidden ? 'Show Users' : 'Hide Users'} style="buttonSmall optional">
                        <img class="video-control-icon" src={state.userlistOnLeft||state.fullscreen? state.userlistHidden ? '/svg/chevron-right.svg' : '/svg/chevron-left.svg' : state.userlistHidden ? '/svg/chevron-up.svg' : '/svg/chevron-down.svg'}/>
                    </Button>
                    <Button enabled={state.profileModal} onclick={() => this.props.updateRoomState({profileModal: true})} style="buttonBig">Profile</Button>
                </div>
                <div class="subControls">
                    {!state.fullscreen && 
                        <Fragment>
                            <Button enabled={false} onclick={this.dropRemoteAndCenter} 
                                title="Drop and center Remote" style={`buttonSmall optional ${state.remote ? "" :"remoteHidden"}`}>
                                <img class="video-control-icon" src="/svg/crosshair.svg"/>
                            </Button>
                            <Button enabled={state.remote} onclick={this.remote} style="buttonSmall" title="remote">
                                <div class="video-control-icon">
                                <RemoteIcon enabled={state.remoteUsed && false}/>
                                </div>
                            </Button>
                        </Fragment>
                    }
                    <Button enabled={state.videoPaused} onclick={this.pauseVideo}
                        title={state.videoPaused ? 'Pause' : 'Play'} style="buttonSmall">
                        <img class="video-control-icon" src={state.videoPaused ? '/svg/play_button.svg' : '/svg/pause_button.svg'}/>
                    </Button>
                    <Button enabled={state.fullscreen}
                        title="Fullscreen" onclick={this.toggleFullscreen} style="buttonSmall">
                        <img class="video-control-icon" src="/svg/fullscreen_button.svg"/>
                    </Button>
                    <Button enabled={state.muted} onclick={this.mute}
                        title={state.muted ? 'Unmute' : 'Mute'} style="buttonSmall">
                        <img class="video-control-icon" src={state.muted ? '/svg/sound-mute.svg' : '/svg/sound-max.svg'}/>
                    </Button>
                    <input id="volumeControl" type="range" min="0" max="100" class="volumeSlider buttonBig" oninput={this.changeVolume} value={this.props.state.muted ? 0 : this.props.state.volume}/>
                    {!state.fullscreen && <Button style="buttonSmall optional remoteHidden"></Button>}
                </div>
                <div class="subControls">
                    {state.roomToken && <Button enabled={state.roomSidebar == SidebarState.SETTINGS}
                            onclick={e => this.toggleRoomSettings(this.props.state.roomId)} style="buttonSmall">
                            <img class="video-control-icon" src="/svg/settings.svg"/>
                        </Button>
                        }
                    <Button enabled={state.roomSidebar == SidebarState.USERS}
                               onclick={e => this.toggleUserSidebar()} style="buttonSmall optional">
                        <img class="video-control-icon" src="/svg/users.svg"/>
                    </Button>
                    <Button enabled={state.roomSidebar == SidebarState.CHAT}
                               onclick={e => this.toggleChatSidebar()} style="buttonSmall optional">
                        <img class="video-control-icon" src="/svg/message-circle.svg"/>
                    </Button>
                </div>
            </div>
    }
}