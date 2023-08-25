import { h } from 'preact'

import { Chat } from './Chat.js'
import { RoomSettings } from './RoomSettings.js'
import { UserlistSidebar } from './UserlistSidebar.js'
import { SidebarState } from './Room.js'
import { AppStateContext } from './appstate/AppStateContext.js'
import { useContext } from 'preact/hooks'
import { WebSocketContext } from './websocket/WebSocketContext.js'

export const RoomSidebar = ({ fullscreen, roomSidebar }) => {
    const { userSettings } = useContext(AppStateContext);
    const { remoteInfo } = useContext(WebSocketContext);

    if(roomSidebar.value == SidebarState.NOTHING) return;

    return <div id="sidebar" class={`sidebar ${fullscreen.value && userSettings.value.transparentChat ? "fullscreenSidebar showChat" : ""} ${remoteInfo.value.remote ? "hasRemote" : ""}`}>
        {(() => {
            switch (roomSidebar.value) {
                case SidebarState.CHAT:
                    return <Chat/>
                case SidebarState.USERS:
                    return <UserlistSidebar />;
                case SidebarState.SETTINGS:
                    return <RoomSettings />
            }
        })()}
    </div>
        ;
}
