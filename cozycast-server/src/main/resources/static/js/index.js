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

var globalVar = {};
export var state = {
    roomId: null,
    roomToken: null,
    typingUsers: [],
    userlist: [],
    roomlist: [],
    chatMessages: [],
    newMessage: false,
    forceChatScroll: false,
    chatBox: "",
    remote: false,
    username: "Anonymous",
    volume: 100,
    videoPaused: true,
    videoLoading: false,
    viewPort: {
        width: 1280,
        height: 720,
    },
    roomSidebar: SidebarState.CHAT,
    workerStatus: WorkerStatus.STARTED,
    roomSettings: {
        workerStarted: true,
        desktopResolution: 720,
        streamResolution: 720,
        framerate: 25,
        videoBitrate: 1000,
        audioBitrate: 96,
        accessType: "public",
        centerRemote: false
    },
    session: null,
    muteChatNotification: false,
    windowTitle: "CozyCast: Low latency screen capture via WebRTC",
    historyMode: false,
    fullscreen: false,
    kicked: false,
    newMessageCount: 0,
    admin: {
        username: "",
        password: ""
    },
    scheduleSidebar: false,
    scheduleMenu: "ROOM_AVAILABILITY",
    editSchedule: {
        days: []
    },
    userlistHidden: false
};

export function queryParams(params) {
    return '?' + Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
}

export function updateState(fun) {
    var result = fun(state)
    if(result !== false)  {
        globalVar.callback(state);
    }
}

class App extends Component {
    render({ page }, { xyz = [] }) {
        globalVar.callback = (data) => {
            this.setState(data);
        };
        return html`
            <${Router}>
        		<${Room} state=${state} path="/" roomId="default"/>
                <${Room} state=${state} path="/room/:roomId"/>
                <${Invite} state=${state} path="/invite/:code"/>
                <${RoomList} state=${state} path="/management/"/>
                <${Admin} state=${state} path="/admin/"/>
            <//>
        `;
    }
}

var preactBody = render(html`<${App}/>`, document.body);
