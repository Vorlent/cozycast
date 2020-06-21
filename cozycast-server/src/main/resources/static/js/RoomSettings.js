import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { SidebarState, WorkerStatus, state, updateState } from '/js/index.js'

import { sendWorkerRestart, sendRoomSettings } from '/js/Room.js'

import { Button } from '/js/Button.js'

import { openInvite, InviteModal } from '/js/InviteModal.js'


import { openBanModal, BanModal } from '/js/BanModal.js'

export class RoomSettings extends Component {

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
        sendWorkerRestart()
    }

    selectAccessType(e) {
        updateState(function (state) {
            state.roomSettings.accessType = e.target.value
        })
    }

    toggleCenterRemote() {
        updateState(function (state) {
            state.roomSettings.centerRemote = !state.roomSettings.centerRemote
        })
    }

    selectDesktopResolution(e) {
        updateState(function (state) {
            state.roomSettings.desktopResolution = e.target.value
        })
    }

    selectStreamResolution(e) {
        updateState(function (state) {
            state.roomSettings.streamResolution = e.target.value
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
        sendRoomSettings(state.roomSettings)
    }

    render({ roomId }, { xyz = [] }) {
        return html`
            <div id="settings">
                <${InviteModal} state=${state}/>
                <${BanModal} state=${state}/>

                <span class="center">Room Access</span>
                <select id="settings-resolution"
                    value=${state.roomSettings.accessType}
                    onChange=${e => this.selectAccessType(e)}>
                  <option value="public">Public</option>
                  <option value="authenticated">Users</option>
                  <option value="invite">Invited Users only</option>
                </select>

                <${Button} onclick=${e => openInvite(state.roomId)}>
                    Create Invite
                <//>

                <${Button} onclick=${e => openBanModal(state.roomId)}>
                    Ban User
                <//>

                <${Button} enabled=${state.workerStarted}
                    onclick=${e => this.toggleWorker(state.roomId)}>
                    ${state.workerStarted ? 'Stop' : 'Start'}
                <//>

                <${Button} onclick=${e => this.restartWorker(state.roomId)}>
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
                            <td>Desktop Resolution</td>
                            <td>
                                <select id="settings-desktop-resolution"
                                    value=${state.roomSettings.desktopResolution}
                                    onChange=${e => this.selectDesktopResolution(e)}>
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
                                    value=${state.roomSettings.streamResolution}
                                    onChange=${e => this.selectStreamResolution(e)}>
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
                                     onChange=${e => this.selectFramerate(e)}>
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
                                     onChange=${e => this.selectVideoBitrate(e)}>
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
                                    value=${state.roomSettings.audioBitrate}
                                    onChange=${e => this.selectAudioBitrate(e)}>
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

                <${Button} onclick=${e => this.saveRoomSettings(roomId)}>
                    Save
                <//>
            </div>
        `;
    }
}
