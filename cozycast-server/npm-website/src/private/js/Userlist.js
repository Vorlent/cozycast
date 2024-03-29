import { h, Fragment } from 'preact'
import { useContext } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext.js';
import { AppStateContext } from './appstate/AppStateContext.js';
import { Clock } from './Clock.js';

export const Userlist = ({ isLeft, fullscreen, hoverText }) => {
    const { userlist, remoteInfo } = useContext(WebSocketContext)
    const { userSettings } = useContext(AppStateContext);

    const { showUsernames, smallPfp } = userSettings.value;

    const showHover = (e, name, isActive) => {
        const pos = isLeft ? "right" : "top";
        if (pos == 'top' && showUsernames)
            return

        let box = e.target.getBoundingClientRect();
        if (pos == 'top') {
            hoverText.value = {
                text: name,
                isActive: isActive,
                x: Math.round(box.x) + box.width / 2,
                y: Math.round(box.y) - box.width / 2 * 1.1,
                pos: 'top'
            }
        } else if (pos == 'right') {
            hoverText.value = {
                text: name,
                isActive: isActive,
                x: Math.round(box.x) + box.width * 1.1,
                y: Math.round(box.y) + box.width / 2,
                pos: 'right'
            }
        }
    }

    const hideHover = () => {
        hoverText.value = null;
    }

    return <div id="userlist" class={`userlist ${smallPfp ? "smallPfp" : ""} ${showUsernames ? "big" : "small"} ${isLeft ? "left" : "bottom"} ${fullscreen ? "fullscreenUserlist" : ""} ${remoteInfo.value.remote ? " hasRemote" : ""}`} >
        {userlist.value.map(user => {
            let background = { 'background-image': `url(${user.url})` };
            if (user.anonymous) background['background-color'] = user.nameColor + "99"
            {
                return <div class="user" key={user.session}>
                    <Clock startTime={user.userEntryTime} />
                    <div class={`avatarContainer ${!showUsernames || isLeft ? "bar" : ""}`}
                        onMouseover={e => showHover(e, user.username, user.active)} onMouseout={hideHover}>
                        <div class={`image avatar ${user.active ? "" : "isAway"}`} style={background} />
                        {user.remote && <div class="orangeCircle"></div>}
                        <div class={`mutedDot ${user.muted ? "" : "noDisplay"}`}>
                            <img class="mutedDotIcon" src="/svg/headphone-slash.svg"></img>
                        </div>
                        <div class={`remoteIcon ${user.remote ? "" : "noDisplay"}`} >
                            <img class="remoteIconIcon" src="/svg/remoteAlpha.svg"></img>
                        </div>

                    </div>
                    {showUsernames && !(smallPfp && isLeft) && <div class={`${user.active ? "" : "isAway"} userprofileName`}>{user.username}</div>}
                </div>
            }
        })}
    </div>
}
