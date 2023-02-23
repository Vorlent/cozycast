import { Component, h } from 'preact'

import { SidebarState, WorkerStatus } from './index.js'

import { Button } from './Button.js'

import { InviteModal } from './InviteModal.js'

import { BanModal } from './BanModal.js'

export class RoomSettings extends Component {
    constructor(props) {
        super(props);
        //since UserRoomSettings is the only component changing these states it's okay to intitalize it like this
        this.state = {
            accessType: this.props.state.roomSettings.accessType,
            centerRemote: this.props.state.roomSettings.centerRemote,
            desktopResolution: this.props.state.roomSettings.desktopResolution,
            streamResolution: this.props.state.roomSettings.streamResolution,
            framerate: this.props.state.roomSettings.framerate,
            videoBitrate: this.props.state.roomSettings.videoBitrate,
            audioBitrate: this.props.state.roomSettings.audioBitrate,
            default_image_permission: this.props.state.roomSettings.default_image_permission,
            default_remote_permission: this.props.state.roomSettings.default_remote_permission,
            banModal: false,
            inviteModal: false
        }
        this.updateSettingsState = this.updateSettingsState.bind(this);
    }

    updateSettingsState = this.setState;

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

    componentDidMount() {
        this.setState({
            accessType: this.props.state.roomSettings.accessType,
            centerRemote: this.props.state.roomSettings.centerRemote,
            desktopResolution: this.props.state.roomSettings.desktopResolution,
            streamResolution: this.props.state.roomSettings.streamResolution,
            framerate: this.props.state.roomSettings.framerate,
            videoBitrate: this.props.state.roomSettings.videoBitrate,
            audioBitrate: this.props.state.roomSettings.audioBitrate,
            default_image_permission: this.props.state.roomSettings.default_image_permission,
            default_remote_permission: this.props.state.roomSettings.default_remote_permission,
            banModal: false,
            inviteModal: false
        }
        )
    }

    sendRoomSettings = () => {
        this.props.sendMessage({
            action: 'room_settings_save',
            desktopResolution: this.state.desktopResolution,
            streamResolution: this.state.streamResolution,
            framerate: this.state.framerate,
            videoBitrate: this.state.videoBitrate,
            audioBitrate: this.state.audioBitrate
        });
        alert("Send!")
    }

    sendRoomAccess = () => {
        this.props.sendMessage({
            action: 'room_access_save',
            default_image_permission: "" + this.state.default_image_permission,
            default_remote_permission: "" + this.state.default_remote_permission,
            accessType: this.state.accessType,
            centerRemote: this.state.centerRemote
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

    selectAccessType = (e) => {
        this.setState({
            accessType: e.target.value
        })
    }

    toggleCenterRemote = () => {
        this.setState({
            centerRemote: !this.state.centerRemote
        })
    }

    selectDesktopResolution(e) {
        this.setState({
            desktopResolution: e.target.value
        })
    }

    selectStreamResolution(e) {
        this.setState({
            streamResolution: e.target.value
        })
    }

    selectFramerate(e) {
        this.setState({
            framerate: e.target.value
        })
    }

    selectVideoBitrate(e) {
        this.setState({
            videoBitrate: e.target.value
        })
    }

    selectAudioBitrate(e) {
        this.setState({
            audioBitrate: e.target.value
        })
    }

    saveRoomSettings = (roomId) => {
        this.sendRoomSettings()
    }

    openBanModal = (room) => {
        this.setState({
            banModal: true
        })
    }

    openInviteModal = (room) => {
        this.setState({
            inviteModal: true
        })
    }

    render({ roomId }, state) {
        return <div id="settings" class="roomSettingsContainer">
            {this.state.inviteModal && <InviteModal state={this.props.state} roomId={this.props.state.roomId} updateSettingsState={this.updateSettingsState} sendMessage={this.props.sendMessage} />}
            {this.state.banModal && <BanModal state={this.props.state} updateSettingsState={this.updateSettingsState} sendMessage={this.props.sendMessage} />}

            <div class="roomSettingCategory">
                <div class="center roomSettingsHeaders">Room Access</div>

                <select id="room-access"
                    value={this.state.accessType}
                    onChange={e => this.selectAccessType(e)}>
                    <option value="public">Public</option>
                    <option value="authenticated">Users</option>
                    <option value="invite">Invited Users only</option>
                </select>

                <label>
                    <input type="checkbox" checked={state.default_image_permission}
                        onclick={() => this.setState(state => { return { default_image_permission: !state.default_image_permission } })} />
                    default image permission
                </label>

                <label>
                    <input type="checkbox" checked={state.default_remote_permission}
                        onclick={() => this.setState(state => { return { default_remote_permission: !state.default_remote_permission } })} />
                    default remote permission
                </label>

                <label>
                    <input type="checkbox" checked={state.centerRemote}
                        onclick={this.toggleCenterRemote} />
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

                <Button style={"maxHeightButton"} onclick={e => this.openBanModal(this.props.state.roomId)}>
                    Ban User
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
            </div>
            <div  class="roomSettingCategory">

                <div class="center roomSettingsHeaders">Stream settings</div>

                <table id="stream-settings">
                    <tbody>
                        <tr>
                            <td>Desktop Resolution</td>
                            <td>
                                <select id="settings-desktop-resolution"
                                    value={this.state.desktopResolution}
                                    onChange={e => this.selectDesktopResolution(e)}>
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
                                    value={this.state.streamResolution}
                                    onChange={e => this.selectStreamResolution(e)}>
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
                                    value={this.state.framerate}
                                    onChange={e => this.selectFramerate(e)}>
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
                                    value={this.state.videoBitrate}
                                    onChange={e => this.selectVideoBitrate(e)}>
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
                                    value={this.state.audioBitrate}
                                    onChange={e => this.selectAudioBitrate(e)}>
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
