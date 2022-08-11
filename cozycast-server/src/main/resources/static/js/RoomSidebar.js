import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { Chat } from '/js/Chat.js'
import { RoomSettings } from '/js/RoomSettings.js'
import { Button } from '/js/Button.js'
import { UserlistSidebar } from '/js/UserlistSidebar.js'

import { SidebarState} from '/js/index.js'

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
