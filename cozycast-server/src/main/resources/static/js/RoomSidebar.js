import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { Chat } from '/js/Chat.js'
import { RoomSettings } from '/js/RoomSettings.js'
import { Button } from '/js/Button.js'

import { SidebarState, state, updateState } from '/js/index.js'

export class RoomSidebar extends Component {

    toggleRoomSettings() {
        updateState(function (state) {
            if(state.roomSidebar != SidebarState.SETTINGS) {
                state.roomSidebar = SidebarState.SETTINGS
            } else {
                state.roomSidebar = SidebarState.CHAT
            }
        })
    }

    render({ roomId }, { xyz = [] }) {
    return html`
        <div id="sidebar">
            <!--<div class="cozycast-pagetitle">
                <span class="cozycast-titletext">${roomId}</span>
                <${Button} enabled=${state.roomSidebar == SidebarState.SETTINGS}
                    onclick=${e => this.toggleRoomSettings(roomId)}>
                    <img class="room-settings-icon" src="/png/settings.png"/>
                <//>
            </div>-->
            ${state.roomSidebar == SidebarState.CHAT &&
                html`<${Chat} state=${state}/>`}

            ${state.roomSidebar == SidebarState.SETTINGS &&
                html`<${RoomSettings} state=${state}/>`}
        </div>
    `;
    }
}
