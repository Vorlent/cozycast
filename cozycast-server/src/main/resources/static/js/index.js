import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import Router from '/js/libs/preact-router/index.js'

import { RoomList } from '/js/RoomList.js'
import { Room } from '/js/Room.js'
import { Invite } from '/js/Invite.js'
import { Admin } from '/js/Admin.js'

export var SidebarState = {
    CHAT: "CHAT",
    SETTINGS: "SETTINGS",
    USERS: "USERS",
    NOTHING: "NOTHING"
}

export var WorkerStatus = {
    STOPPED: "STOPPED",
    STARTING: "STARTING",
    STARTED: "STARTED"
}

export function queryParams(params) {
    return '?' + Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
}

class App extends Component {
    render({ page }, { xyz = [] }) {
        return html`
            <${Router}>
        		<${Room} path="/" roomId="default"/>
                <${Room} path="/room/:roomId"/>
                <${Invite} path="/invite/:code"/>
                <${RoomList} path="/management/"/>
                <${Admin} path="/admin/"/>
            <//>
        `;
    }
}

var preactBody = render(html`<${App}/>`, document.body);
