import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { Chat } from '/js/Chat.js'
import { RoomSettings } from '/js/RoomSettings.js'
import { Button } from '/js/Button.js'

import { SidebarState, state, updateState } from '/js/index.js'

export class RoomSidebar extends Component {

    render({ roomId }, { xyz = [] }) {
        return html`
            <div id="sidebar">
                ${state.roomToken
                && html`<div class="cozycast-pagetitle">
                    <span class="cozycast-titletext">${roomId}</span>
                </div>`}
                ${state.roomSidebar == SidebarState.CHAT &&
                    html`<${Chat} state=${state}/>`}

                ${state.roomSidebar == SidebarState.SETTINGS
                    && state.roomToken
                    && html`<${RoomSettings} state=${state}/>`}
            </div>
        `;
    }
}
