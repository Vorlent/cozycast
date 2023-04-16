import { h } from 'preact'
import { useContext } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext';

export const UserlistSidebar = () => {
    const { userlist } = useContext(WebSocketContext)

    return <div class="userlistSidebar">
        {userlist.value.map(user =>
            <div class="userSidebar">
                <div class="avatarContainer">
                    <div class="image avatar" style={{ 'background-image': `url(${user.url})` }} />
                    <div class={`onlineDot ${user.active ? "isOnline" : "isInactive"}`}></div>
                    <div class={`mutedDot ${user.muted ? "" : "noDisplay"}`}>
                        <img class="mutedDotIcon" src="/svg/headphone-slash.svg"></img>
                    </div>
                </div>
                <div class="usernameSidebar">
                    <div class="usernameList">{user.username}</div>
                    {!user.active &&
                        <div class="lastSeen">last seen: <span>{user.lastTimeSeen}</span></div>
                    }
                </div>
            </div>
        )}
    </div>
}