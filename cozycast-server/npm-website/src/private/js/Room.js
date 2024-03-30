import { h, Fragment } from 'preact'
import { useCallback, useContext, useEffect } from 'preact/hooks'
import { useSignal } from '@preact/signals'
import { route } from 'preact-router'

import moment from 'moment'

import { AppStateContext } from './appstate/AppStateContext.js'
import { WebSocketContext } from './websocket/WebSocketContext.js'
import { RoomSidebar } from './RoomSidebar.js'
import { UserRoomSettings } from './UserRoomSettings.js'
import { Userlist } from './Userlist.js'
import { VideoControls } from './VideoControls.js'
import { Controls } from './Controls.js'
import { UserHoverName } from './UserHoverName.js'
import { InfoScreen } from './InfoScreen.js';
import { DefaultButton } from './DefaultButton.js'



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

let idleTimer = null;
let idleState = false;
function removeCursor(e) {
    let sidebar = document.getElementById("sidebar");
    let time = 2400;
    clearTimeout(idleTimer);
    if (idleState == true) {
        document.getElementById("pagetoolbar").classList.remove("hideToolbar");
        document.getElementById("videoBig").classList.remove("hideCursor");
        if (sidebar) {
            sidebar.classList.add("showChat");
            sidebar.classList.remove("hideChat");
        }
    }
    idleState = false;
    idleTimer = setTimeout(function () {
        if (document.fullscreenElement == null) return;
        document.getElementById("pagetoolbar").classList.add("hideToolbar");
        document.getElementById("videoBig").classList.add("hideCursor");
        let sidebar = document.getElementById("sidebar");
        if (sidebar) {
            sidebar.classList.add("hideChat");
            sidebar.classList.remove("showChat");
        }
        idleState = true;
    }, time);
}

export const Room = () => {
    const { userSettings } = useContext(AppStateContext);
    const { banned } = useContext(WebSocketContext);
    const roomSidebar = useSignal(SidebarState.CHAT);
    const userlistHidden = useSignal(false);
    const fullscreen = useSignal(false);
    const userRoomSettings = useSignal(false);
    const hoverText = useSignal(null);

    const fullScreenEvent = () => {
        fullscreen.value = document.fullscreenElement != null;
        if (fullscreen.value) {
            document.getElementById("pagecontent").addEventListener('mousemove', removeCursor);
            setTimeout(() => {
                removeCursor();
                let messages = document.getElementById("messages");
                if (messages) {
                    messages.scrollTop = messages.scrollHeight;
                }
            }, 1);
        } else {
            window.removeEventListener('mousemove', removeCursor);
        }
    }

    useEffect(() => {
        document.addEventListener('fullscreenchange', fullScreenEvent);
        return () => {
            document.removeEventListener('fullscreenchange', fullScreenEvent);
        }
    }, []);

    const closeSettings = useCallback(() => {
        userRoomSettings.value = false;
    }, [])

    const sideUserlist = !userlistHidden.value && (fullscreen.value || userSettings.value.userlistOnLeft)
    const bottomUserlist = !userlistHidden.value && !fullscreen.value && !userSettings.value.userlistOnLeft
    const copyright = !userlistHidden.value && !fullscreen.value;

    if (banned.value) {
        return (<InfoScreen message={'You are banned'} submessage={`until ${banned.value == "unlimited" ? "unlimited" : moment(banned.value).format('h:mm:ss A')}`}>
            <DefaultButton enabled={true} onclick={e => route("/", false)}>
                ok
            </DefaultButton>
        </InfoScreen>);
    }

    return (
        <Fragment>
            {sideUserlist &&
                <div><Userlist
                    hoverText={hoverText}
                    isLeft={true}
                    fullscreen={fullscreen.value} /></div>}
            <div id="videoWrapper" class="videoWrapper">
                <VideoControls />
                <div id="pagetoolbar" class={fullscreen.value ? "toolbarFullscreen" : ""}>
                    <Controls
                        fullscreen={fullscreen}
                        roomSidebar={roomSidebar}
                        userlistHidden={userlistHidden}
                        userRoomSettings={userRoomSettings} />
                    {bottomUserlist &&
                        <Userlist
                            hoverText={hoverText}
                            isLeft={false} />
                    }
                </div>
            </div>
            <RoomSidebar fullscreen={fullscreen} roomSidebar={roomSidebar} />
            {userRoomSettings.value &&
                <UserRoomSettings close={closeSettings} />}
            <UserHoverName hoverText={hoverText} />
            {copyright &&
                <a tabindex="-1" id="copyright" href="/license" target="_blank" class={userSettings.value.userlistOnLeft ? "left" : "bottom"}>Copyright (C) 2024 Vorlent</a>}
        </Fragment>
    );
}
