import { h, Fragment } from 'preact'
import { useContext, useState } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext.js';
import { AppStateContext } from './appstate/AppStateContext.js';

/**
 * Specialized component to handle manual loading of user profile pictures.
 */
const ManualAvatarLoader = ({ user, manualLoadMedia }) => {
    const [revealed, setRevealed] = useState(false);

    const handleReveal = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setRevealed(true);
    };

    const isRevealed = !manualLoadMedia || revealed;
    
    let style = {};
    if (isRevealed) {
        style['background-image'] = `url(${user.url})`;
    }
    
    // We keep the background color for anonymous users so the UI remains consistent
    if (user.anonymous) {
        style['background-color'] = user.nameColor + "99";
    }

    return (
        <div 
            className={`image avatar ${user.active ? "" : "isAway"} ${!isRevealed ? "manual-load-pfp" : ""}`} 
            style={style}
            onClick={!isRevealed ? handleReveal : null}
        >
            {!isRevealed && (
                <img 
                    className="placeholder-pfp-icon" 
                    src="/svg/user-silhouette.svg" 
                    alt="Load profile picture"
                />
            )}
        </div>
    );
};

export const Userlist = ({ isLeft, fullscreen, hoverText }) => {
    const { userlist, remoteInfo } = useContext(WebSocketContext)
    const { userSettings } = useContext(AppStateContext);

    const { showUsernames, smallPfp, manualLoadMedia } = userSettings.value;

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

    return (
        <div id="userlist" class={`userlist ${smallPfp ? "smallPfp" : ""} ${showUsernames ? "big" : "small"} ${isLeft ? "left" : "bottom"} ${fullscreen ? "fullscreenUserlist" : ""} ${remoteInfo.value.remote ? " hasRemote" : ""}`} >
            {userlist.value.map(user => (
                <div class="user" key={user.session}>
                    <div
                        class={`avatarContainer ${!showUsernames || isLeft ? "bar" : ""}`}
                        onMouseover={e => showHover(e, user.username, user.active)}
                        onMouseout={hideHover}
                    >
                        {/* New Manual Loader Component */}
                        <ManualAvatarLoader
                            user={user}
                            manualLoadMedia={manualLoadMedia}
                        />

                        {user.remote && <div class="orangeCircle"></div>}

                        <div class={`mutedDot ${user.muted ? "" : "noDisplay"}`}>
                            <img class="mutedDotIcon" src="/svg/headphone-slash.svg" />
                        </div>

                        <div class={`remoteIcon ${user.remote ? "" : "noDisplay"}`} >
                            <img class="remoteIconIcon" src="/svg/remoteAlpha.svg" />
                        </div>
                    </div>

                    {showUsernames && !(smallPfp && isLeft) && (
                        <div class={`${user.active ? "" : "isAway"} userprofileName`}>
                            {user.username}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}