import { h } from 'preact'
import { Button } from './Button.js'
import { route } from 'preact-router'
import { SidebarState } from './Room.js'

import { RemoteIcon } from '../svg/RemoteIcon.js'
import { useContext } from 'preact/hooks'
import { AppStateContext } from './appstate/AppStateContext.js'
import { WebSocketContext } from './websocket/WebSocketContext.js'

export const Controls = ({ roomSidebar, userlistHidden, userRoomSettings, fullscreen }) => {
    const { userSettings, volume, muted } = useContext(AppStateContext);
    const { userlistOnLeft, showIfMuted } = userSettings.value;

    const { streamRunning ,sendMessage, remoteInfo, permissions, authorization, roomSettings, toggleVideo, videoPaused } = useContext(WebSocketContext);
    const disabledRemote = remoteInfo.value.remoteUsed && roomSettings.value.remote_remote_ownership;

    const changeVolume = (e) => {
        if (e.target.value == 0) {
            mute();
        }
        else {
            volume.value = e.target.value;
            localStorage.setItem("volume", e.target.value);
            if (muted.value) {
                mute();
            }
        }
    }

    const mute = () => {
        let updatedMuted = !muted.value;
        localStorage.setItem("muted", updatedMuted);
        if (showIfMuted) {
            sendMessage({
                action: 'userMuted',
                muted: updatedMuted || videoPaused.value
            });
        }
        muted.value = updatedMuted;
    }

    const toggleRoomSettings = () => {
        roomSidebar.value = roomSidebar.value != SidebarState.SETTINGS ? SidebarState.SETTINGS : SidebarState.NOTHING
    }

    const toggleUserSidebar = () => {
        roomSidebar.value = roomSidebar.value != SidebarState.USERS ? SidebarState.USERS : SidebarState.NOTHING;
    }

    const toggleChatSidebar = () => {
        roomSidebar.value = roomSidebar.value != SidebarState.CHAT ? SidebarState.CHAT : SidebarState.NOTHING;
    }

    const hideUserlist = () => {
        userlistHidden.value = !userlistHidden.value;
    }

    const toggleFullscreen = () => {
        if (document.fullscreenElement != null) {
            document.exitFullscreen()
        } else {
            document.getElementById("pagecontent").requestFullscreen()
        }
    }

    const dropRemoteAndCenter = () => {
        if (remoteInfo.value.remote) {
            sendMessage({
                action: 'drop_remote',
                center: true
            });
        }
    }

    const stopVm = () => {
        const userConfirmed = window.confirm("This will stop the stream for all users. Are you sure you want to continue?");
        
        if (userConfirmed) {
            sendMessage({
                action: 'stop_vm'
            });
        } else {
            // Optional: You can handle the "cancel" action here if needed
            console.log("Action cancelled.");
        }
    };

    const remote = () => {
        if (disabledRemote) return;
        if (remoteInfo.value.remote) {
            sendMessage({
                action: 'drop_remote'
            });
        } else {
            sendMessage({
                action: 'pickup_remote'
            });
        }
    }

    let middle = (
        <div class={`subControls ${fullscreen.value ? "fullscreenRemote" : ""}`}>
            <Button enabled={false} onclick={dropRemoteAndCenter}
                title="Drop and center Remote" style={`buttonSmall optional ${remoteInfo.value.remote ? "" : "remoteHidden"}`}>
                <img class="video-control-icon" src="/svg/crosshair.svg" />
            </Button>
            {permissions.value.remotePermission && <Button enabled={remoteInfo.value.remote} onclick={remote} style="buttonSmall" title="remote">
                <div class={`video-control-icon`}>
                    <RemoteIcon enabled={!disabledRemote} />
                </div>
            </Button>
            }
            <Button enabled={videoPaused.value} onclick={toggleVideo} disabled={!streamRunning.value}
                title={videoPaused.value ? 'Pause' : 'Play'} style="buttonSmall">
                <img class="video-control-icon" src={videoPaused.value ? '/svg/play_button.svg' : '/svg/pause_button.svg'} />
            </Button>
            <Button enabled={fullscreen.value} disabled={!streamRunning.value}
                title="Fullscreen" onclick={toggleFullscreen} style="buttonSmall">
                <img class="video-control-icon" src="/svg/fullscreen_button.svg" />
            </Button>
            <Button enabled={muted.value} onclick={mute}
                title={muted.value ? 'Unmute' : 'Mute'} style="buttonSmall">
                <img class="video-control-icon" src={muted.value ? '/svg/sound-mute.svg' : '/svg/sound-max.svg'} />
            </Button>
            <input id="volumeControl" tabindex="0" type="range" min="0" max="100" class="volumeSlider buttonBig" oninput={changeVolume} value={muted.value ? 0 : volume.value} />
        </div>)

    if (fullscreen.value && remoteInfo.value.remote) return middle;

    return (
        <div id="controls" class={fullscreen.value ? "controlsFullscreen" : "visibleControls"}>
            <div class="subControls">
                <Button enabled={false} onclick={hideUserlist}
                    title={userlistHidden.value ? 'Show Users' : 'Hide Users'} style="buttonSmall optional">
                    <img class="video-control-icon" src={userlistOnLeft || fullscreen.value ? userlistHidden.value ? '/svg/chevron-right.svg' : '/svg/chevron-left.svg' : userlistHidden.value ? '/svg/chevron-up.svg' : '/svg/chevron-down.svg'} />
                </Button>
                <Button enabled={userRoomSettings.value}
                    onclick={() => userRoomSettings.value = true} style="buttonSmall">
                    <img class="video-control-icon" src="/svg/settings.svg" />
                </Button>
                <a class='btn btn-primary buttonSmall' href='/' style={{ display: 'flex' }}>
                    <img class="video-control-icon" src="/svg/home.svg" style={{ 'pointer-events': 'none' }} />
                </a>
                <Button enabled={true}
                    title="StopVM" onclick={stopVm} style="buttonSmall">
                    <img class="video-control-icon" src="/svg/pause_button.svg" />
                </Button>
            </div>
            {middle}
            <div class="subControls">
                {authorization.value.admin &&
                    <Button enabled={roomSidebar == SidebarState.SETTINGS}
                        onclick={toggleRoomSettings} style="buttonSmall">
                        <img class="video-control-icon" src="/svg/settings.svg" />
                    </Button>
                }
                <Button enabled={roomSidebar == SidebarState.USERS}
                    onclick={toggleUserSidebar} style="buttonSmall optional">
                    <img class="video-control-icon" src="/svg/users.svg" />
                </Button>
                <Button enabled={roomSidebar == SidebarState.CHAT}
                    onclick={toggleChatSidebar} style="buttonSmall optional">
                    <img class="video-control-icon" src="/svg/message-circle.svg" />
                </Button>
            </div>
        </div>)
}