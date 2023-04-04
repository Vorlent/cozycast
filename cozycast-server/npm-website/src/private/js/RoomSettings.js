import { Component, h } from 'preact'

import { SidebarState, WorkerStatus } from './index.js'

import { Button } from './Button.js'

import { InviteModal } from './InviteModal.js'

import { PermissionManager } from './PermissionManager.js'

import { Modulate } from './Modulate.js'
import { RoomAdminUserlist } from './RoomAdminUserlist.js'

export class RoomSettings extends Component {
    constructor(props) {
        super(props);
        //since UserRoomSettings is the only component changing these states it's okay to intitalize it like this
        this.state = {
            roomSettings: {
                ...this.props.state.roomSettings
            },
            inviteModal: false,
            permissionModal: false,
            allroompermissionModal: false,
        }
        this.updateSettingsState = this.updateSettingsState.bind(this);
    }

    updateSettingsState = this.setState;

    componentDidUpdate(prevProps, prevState) {
        if(this.props.state.roomSettings !== prevProps.state.roomSettings) {
            this.setState({
                roomSettings: {
                    ...this.props.state.roomSettings
                }
            })
        }
    }

    toggleWorker() {
        var token = localStorage.getItem("adminToken");
        if (this.props.state.workerStatus == WorkerStatus.STOPPED) {
            fetch(`/api/room/${this.props.state.roomId}/worker/stop`, { method: "POST", headers: { 'Authorization': "Bearer " + token } })
                .then((e) => e.json()).then((e) => {
                    this.props.updateRoomState({ workerStatus: WorkerStatus.STARTING })
                });
        }
        if (this.props.state.workerStatus == WorkerStatus.STARTED) {
            fetch(`/api/room/${this.props.state.roomId}/worker/start`, { method: "POST", headers: { 'Authorization': "Bearer " + token } })
                .then((e) => e.json()).then((e) => {
                    this.props.updateRoomState({ workerStatus: WorkerStatus.STOPPED })
                });
        }
    }

    sendRoomSettings = () => {
        this.props.sendMessage({
            action: 'room_settings_save',
            desktopResolution: this.state.roomSettings.desktopResolution,
            streamResolution: this.state.roomSettings.streamResolution,
            framerate: this.state.roomSettings.framerate,
            videoBitrate: this.state.roomSettings.videoBitrate,
            audioBitrate: this.state.roomSettings.audioBitrate
        });
        alert("Send!")
    }

    sendRoomAccess = () => {
        this.props.sendMessage({
            action: 'room_access_save',
            remote_ownership: "" + this.state.roomSettings.remote_ownership,
            default_image_permission: "" + this.state.roomSettings.default_image_permission,
            default_remote_permission: "" + this.state.roomSettings.default_remote_permission,
            accessType: this.state.roomSettings.accessType,
            centerRemote: this.state.roomSettings.centerRemote
        });
        alert("Send!")
    }

    sendWorkerRestart = () => {
        this.props.sendMessage({
            action: 'worker_restart'
        });
    }

    restartWorker = () => {
        this.sendWorkerRestart()
    }

    updateRoomSettings = (field,e) => {
        this.setState(prevState => ({
            roomSettings: {
              ...prevState.roomSettings,
              [field]: e.target.value
            }
          }));
    }

    toggleRoomSettings = (field) => {
        this.setState(prevState => ({
            roomSettings: {
              ...prevState.roomSettings,
              [field]: !prevState.roomSettings[field]
            }
          }));
    }

    saveRoomSettings = (roomId) => {
        this.sendRoomSettings()
    }

    openInviteModal = (room) => {
        this.setState({
            inviteModal: true
        })
    }

    openPermissionModal = (room) => {
        this.props.sendMessage({
            action: 'getuserinfo'
        });
        this.setState({
            permissionModal: true
        })
    }

    closePermissionModal = () => {
        this.setState({
            permissionModal: false
        })
    }

    closeAllRoomPermissionModal = () => {
        this.setState({
            allroompermissionModal: false
        })
    }

    render({ roomId }, state) {
        return <div id="settings" class="roomSettingsContainer">
            {this.state.inviteModal && <InviteModal state={this.props.state} roomId={this.props.state.roomId} updateSettingsState={this.updateSettingsState} sendMessage={this.props.sendMessage} />}
            {this.state.banModal && <BanModal state={this.props.state} updateSettingsState={this.updateSettingsState} sendMessage={this.props.sendMessage} />}
            {this.state.permissionModal && <Modulate title="Current User Management" closeCallback={this.closePermissionModal}>
                <RoomAdminUserlist 
                    userlistadmin={this.props.state.userlistadmin} 
                    sendMessage={this.props.sendMessage}
                    default_image_permission={this.props.state.roomSettings.default_image_permission}
                    default_remote_permission={this.props.state.roomSettings.default_remote_permission}
                    />
                </Modulate>}
            {state.allroompermissionModal && <Modulate title="All Room Users" closeCallback={this.closeAllRoomPermissionModal}>
                <PermissionManager room={this.props.state.roomId}/>
                </Modulate>}

            <div class="roomSettingCategory">
                <div class="center roomSettingsHeaders">Room Access</div>

                <select id="room-access"
                    value={this.state.roomSettings.accessType}
                    onChange={e => this.updateRoomSettings('accessType',e)}>
                    <option value="public">Public</option>
                    <option value="authenticated">Users</option>
                    <option value="invite">Invited Users only</option>
                </select>

                <label>
                    <input type="checkbox" checked={state.roomSettings.default_image_permission}
                        onclick={() => this.toggleRoomSettings('default_image_permission')} />
                    Default Image Permission
                </label>

                <label>
                    <input type="checkbox" checked={state.roomSettings.default_remote_permission}
                        onclick={() => this.toggleRoomSettings('default_remote_permission')} />
                    Default Remote Permission
                </label>

                <label>
                    <input type="checkbox" checked={state.roomSettings.remote_ownership}
                        onclick={() => this.toggleRoomSettings('remote_ownership')} />
                    Remote Ownership
                </label>

                <label>
                    <input type="checkbox" checked={state.roomSettings.centerRemote}
                        onclick={() => this.toggleRoomSettings('centerRemote')} />
                    Always Center Remote
                </label>

                <Button enabled={true} style={"maxHeightButton"} onclick={this.sendRoomAccess}>
                    Update Room Access
                </Button>
            </div>

            <div  class="roomSettingCategory">
                <div class="center roomSettingsHeaders">Admin Tools</div>

                <Button style={"maxHeightButton"} onclick={e => this.openInviteModal(this.props.state.roomId)}>
                    Create Invite
                </Button>

                { false &&
                <Button  style={"maxHeightButton"} enabled={this.props.state.roomSettings.workerStarted}
                    onclick={e => this.toggleWorker(this.props.state.roomId)}>
                    {this.props.state.roomSettings.workerStarted ? 'Stop' : 'Start'}
                </Button>
                }

                <Button style={"maxHeightButton"} onclick={e => this.restartWorker(this.props.state.roomId)}>
                    Restart
                </Button>
                <Button style={"maxHeightButton"} onclick={e => this.openPermissionModal(this.props.state.roomId)}>
                    Current User Management
                </Button>
                <Button style={"maxHeightButton"} onclick={e => this.setState({allroompermissionModal: true })}>
                    All Room Users
                </Button>
            </div>
            <div  class="roomSettingCategory">

                <div class="center roomSettingsHeaders">Stream settings</div>

                <table id="stream-settings">
                    <tbody>
                        <tr>
                            <td>Desktop Resolution</td>
                            <td>
                                <select id="settings-desktop-resolution"
                                    value={this.state.roomSettings.desktopResolution}
                                    onChange={e => this.updateRoomSettings('desktopResolution',e)}>
                                    <option value="1080">1080p</option>
                                    <option value="720">720p</option>
                                    <option value="480">480p</option>
                                    <option value="240">240p</option>
                                    <option value="144">144p</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td>Stream Resolution</td>
                            <td>
                                <select id="settings-stream-resolution"
                                    value={this.state.roomSettings.streamResolution}
                                    onChange={e => this.updateRoomSettings('streamResolution',e)}>
                                    <option value="1080">1080p</option>
                                    <option value="720">720p</option>
                                    <option value="480">480p</option>
                                    <option value="240">240p</option>
                                    <option value="144">144p</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td>Frame Rate</td>
                            <td>
                                <select id="settings-framerate"
                                    value={this.state.roomSettings.framerate}
                                    onChange={e => this.updateRoomSettings('framerate',e)}>
                                    <option value="30">30 fps</option>
                                    <option value="25">25 fps</option>
                                    <option value="20">20 fps</option>
                                    <option value="15">15 fps</option>
                                    <option value="10">10 fps</option>
                                    <option value="5">5 fps</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td>Video Bitrate</td>
                            <td>
                                <select id="settings-video-bitrate"
                                    value={this.state.roomSettings.videoBitrate}
                                    onChange={e => this.updateRoomSettings('videoBitrate',e)}>
                                    <option value="2M">2 Mb/s</option>
                                    <option value="1M">1 Mb/s</option>
                                    <option value="500k">0.5 Mb/s</option>
                                    <option value="300k">0.3 Mb/s</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td>Audio Bitrate</td>
                            <td>
                                <select id="settings-audio-bitrate"
                                    value={this.state.roomSettings.audioBitrate}
                                    onChange={e => this.updateRoomSettings('audioBitrate',e)}>
                                    <option value="192k">192 Kb/s</option>
                                    <option value="96k">96 Kb/s</option>
                                    <option value="64k">64 Kb/s</option>
                                    <option value="48k">48 Kb/s</option>
                                    <option value="32k">32 Kb/s</option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <Button enabled={true} style={"maxHeightButton"} onclick={e => this.saveRoomSettings(this.props.roomId)}>
                    Update Stream Settings
                </Button>
            </div>
        </div>
            ;
    }
}
