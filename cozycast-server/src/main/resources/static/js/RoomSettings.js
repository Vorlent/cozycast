import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { SidebarState, WorkerStatus, state, updateState } from '/js/index.js'

import { Button } from '/js/Button.js'

import { openInvite, InviteModal } from '/js/InviteModal.js'

export class RoomSettings extends Component {

    openKickModal() {
        console.log("openKickModal")
    }

    openBanModal() {
        console.log("openBanModal")
    }

    toggleWorker() {
        var token = localStorage.getItem("adminToken");
        if(state.roomSettings.workerStarted == WorkerStatus.STOPPED) {
            fetch('/api/room/{roomId}/worker/stop', {method: "POST", headers: { 'Authorization': "Bearer " + token }})
                .then((e) => e.json()).then(function (e) {
                updateState(function (state) {
                    // TODO CHECK FOR FAILURE
                    state.roomSettings.workerStarted = WorkerStatus.STARTING
                })
            });
        }
        if(state.roomSettings.workerStarted == WorkerStatus.STARTED) {
            fetch('/api/room/{roomId}/worker/start', {method: "POST", headers: { 'Authorization': "Bearer " + token }})
                .then((e) => e.json()).then(function (e) {
                updateState(function (state) {
                    // TODO CHECK FOR FAILURE
                    state.roomSettings.workerStarted = WorkerStatus.STOPPED
                })
            });
        }
    }

    restartWorker() {
        var token = localStorage.getItem("adminToken");
        if(state.roomSettings.workerStarted == WorkerStatus.STARTED) {
            fetch('/api/room/{roomId}/worker/restart', {method: "POST", headers: { 'Authorization': "Bearer " + token }})
                .then((e) => e.json()).then(function (e) {
                updateState(function (state) {
                    // TODO CHECK FOR FAILURE
                    state.roomSettings.workerStarted = WorkerStatus.STOPPED
                })
            });
        }
    }

    toggleCenterRemote() {
        updateState(function (state) {
            state.roomSettings.centerRemote = !state.roomSettings.centerRemote
        })
    }

    selectResolution(e) {
        updateState(function (state) {
            state.roomSettings.resolution = e.target.value
        })
    }

    selectFramerate(e) {
        updateState(function (state) {
            state.roomSettings.framerate = e.target.value
        })
    }

    selectVideoBitrate(e) {
        updateState(function (state) {
            state.roomSettings.videoBitrate = e.target.value
        })
    }

    selectAudioBitrate(e) {
        updateState(function (state) {
            state.roomSettings.audioBitrate = e.target.value
        })
    }

    saveRoomSettings(roomId) {
        console.log("saveRoomSettings")
    }

    render({ roomId }, { xyz = [] }) {
        return html`
            <div id="settings">
                <${InviteModal} state=${state}/>

                <span class="center">Room Access</span>
                <select id="settings-resolution"
                    value=${state.roomSettings.accessType}
                    onChange=${e => selectAccessType(e)}>
                  <option value="public">Public</option>
                  <option value="authenticated">Users</option>
                  <option value="invite">Invited Users only</option>
                </select>

                <${Button} onclick=${e => openInvite(state.roomId)}>
                    Create Invite
                <//>

                <${Button} onclick=${e => this.openKickModal(roomId)}>
                    Kick User
                <//>

                <${Button} onclick=${e => this.openBanModal(roomId)}>
                    Ban User
                <//>

                <${Button} enabled=${state.workerStarted}
                    onclick=${e => this.toggleWorker(roomId)}>
                    ${state.workerStarted ? 'Stop' : 'Start'}
                <//>

                <${Button} onclick=${e => this.restartWorker(roomId)}>
                    Restart
                <//>

                <${Button} enabled=${state.roomSettings.centerRemote}
                    onclick=${e => this.toggleCenterRemote()}>
                    Center Remote
                <//>

                <span class="center">Stream settings</span>

                <table id="stream-settings">
                    <tbody>
                        <tr>

                            <td>Resolution</td>
                            <td>
                                <select id="settings-resolution"
                                    value=${state.roomSettings.resolution}
                                    onChange=${e => selectResolution(e)}>
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
                                     value=${state.roomSettings.framerate}
                                     onChange=${e => selectFramerate(e)}>
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
                                     value=${state.roomSettings.videoBitrate}
                                     onChange=${e => selectVideoBitrate(e)}>
                                    <option value="2000">2 Mb/s</option>
                                    <option value="1000">1 Mb/s</option>
                                    <option value="500">0.5 Mb/s</option>
                                    <option value="300">0.3 Mb/s</option>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td>Audio Bitrate</td>
                            <td>
                                <select id="settings-audio-bitrate"
                                    value=${state.roomSettings.audioBitrate}
                                    onChange=${e => selectAudioBitrate(e)}>
                                  <option value="192">192 Kb/s</option>
                                  <option value="96">96 Kb/s</option>
                                  <option value="64">64 Kb/s</option>
                                  <option value="48">48 Kb/s</option>
                                  <option value="32">32 Kb/s</option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <${Button} onclick=${e => this.saveRoomSettings(roomId)}>
                    Save
                <//>
            </div>
        `;
    }
}
