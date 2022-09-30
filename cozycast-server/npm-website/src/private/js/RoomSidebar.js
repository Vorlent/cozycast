import { Component, h } from 'preact'

import { Chat } from './Chat.js'
import { RoomSettings } from './RoomSettings.js'
import { UserlistSidebar } from './UserlistSidebar.js'
import { SidebarState} from './index.js'

export class RoomSidebar extends Component {

    render({ roomId, state }) {
        return <div id="sidebar" class={`sidebar ${state.fullscreen && state.transparentChat ? "fullscreenSidebar showChat" : ""} ${state.remote ? "hasRemote" : ""}`}>
                {state.roomToken && <div class="cozycast-pagetitle">
                        <span class="cozycast-titletext">{roomId}</span>
                    </div>
                }
                {state.roomSidebar == SidebarState.CHAT &&
                   <Chat state={state} sendMessage={this.props.sendMessage} updateRoomState={this.props.updateRoomState} profile={this.props.profile} permissions={this.props.permissions}/>}
                {state.roomSidebar == SidebarState.USERS && <UserlistSidebar state={state}/>}
                {state.roomSidebar == SidebarState.SETTINGS && state.roomToken
                    && <RoomSettings state={state} sendMessage={this.props.sendMessage} updateRoomState={this.props.updateRoomState}/>}
            </div>
        ;
    }
}
