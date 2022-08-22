import { Component, render } from 'preact'
import { html } from 'htm/preact'

import { Chat } from './Chat.js'
import { RoomSettings } from './RoomSettings.js'
import { UserlistSidebar } from './UserlistSidebar.js'
import { SidebarState} from './index.js'

export class RoomSidebar extends Component {

    render({ roomId, state }, { xyz = [] }) {
        return html`
            <div id="sidebar">
                ${state.roomToken
                && html`<div class="cozycast-pagetitle">
                    <span class="cozycast-titletext">${roomId}</span>
                </div>`}
                ${state.roomSidebar == SidebarState.CHAT &&
                    html`<${Chat} state=${state} sendMessage=${this.props.sendMessage} updateRoomState=${this.props.updateRoomState}/>`}
                ${state.roomSidebar == SidebarState.USERS &&
                html`<${UserlistSidebar} state=${state}/>`}
                ${state.roomSidebar == SidebarState.SETTINGS
                    && state.roomToken
                    && html`<${RoomSettings} state=${state} sendMessage=${this.props.sendMessage} updateRoomState=${this.props.updateRoomState}/>`}
            </div>
        `;
    }
}
