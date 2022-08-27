import { Component, render, h } from 'preact'
import { Router } from 'preact-router'

import { Admin } from './Admin.js'
import { RoomList } from './RoomList.js'
import { Invite } from './Invite.js'
import { Room } from './Room.js'

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
    render() {
        return <Router>
                <Room path="/" roomId="default"/>
                <Room path="/room/:roomId"/>
                <Invite path="/invite/:code"/>
                <RoomList path="/management/"/>
                <Admin path="/admin/"/>
            </Router>
        ;
    }
}

render(<App/>, document.body);
