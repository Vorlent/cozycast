import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { SidebarState, state, updateState } from '/js/index.js'

import { Button } from '/js/Button.js'


export class RoomSettings extends Component {

    saveRoomSettings() {
        console.log("saveRoomSettings")
    }

    openInviteModal() {
        console.log("openInviteModal")
    }

    render({ roomId }, { xyz = [] }) {
        return html`
            <div id="settings">

                Room Access:
                <select id="settings-resolution">
                  <option selected="selected" value="public">Public</option>
                  <option selected="selected" value="authenticated">Users</option>
                  <option selected="selected" value="invite">Invited Users only</option>
                </select>

                <${Button} onclick=${e => this.openInviteModal(roomId)}>
                    Create Invite
                <//>

                <br/>

                <${Button} onclick=${e => this.openInviteModal(roomId)}>
                    Kick User
                <//>

                <${Button} onclick=${e => this.openInviteModal(roomId)}>
                    Ban User
                <//>

                <${Button} onclick=${e => this.openInviteModal(roomId)}>
                    Start/Stop
                <//>

                <${Button} onclick=${e => this.openInviteModal(roomId)}>
                    Restart
                <//>

                <${Button} onclick=${e => this.openInviteModal(roomId)}>
                    Center Remote
                <//>

                Stream settings:
                <br/>

                Resolution:
                <select id="settings-resolution">
                  <option value="1080">1080p</option>
                  <option selected="selected" value="720">720p</option>
                  <option value="480">480p</option>
                  <option value="240">240p</option>
                  <option value="144">144p</option>
                </select>

                Frame Rate:
                <select id="settings-framerate">
                  <option value="30">30</option>
                  <option selected="selected" value="25">25</option>
                  <option value="20">20</option>
                  <option value="15">15</option>
                  <option value="10">10</option>
                  <option value="5">5</option>
                </select>

                Video Bitrate:
                <select id="settings-video-bitrate">
                  <option value="2000">2 Mb/s</option>
                  <option selected="selected" value="1000">1 Mb/s</option>
                  <option value="500">0.5 Mb/s</option>
                  <option value="300">0.3 Mb/s</option>
                </select>

                Audio Bitrate:
                <select id="settings-audio-bitrate">
                  <option value="192">192 Kb/s</option>
                  <option selected="selected" value="96">96 Kb/s</option>
                  <option value="64">64 Kb/s</option>
                  <option value="48">48 Kb/s</option>
                  <option value="32">32 Kb/s</option>
                </select>

                <${Button} onclick=${e => this.saveRoomSettings(roomId)}>
                    Save
                <//>
            </div>
        `;
    }
}
