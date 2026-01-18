import { h } from 'preact'
import { Router } from 'preact-router'
import { Match } from 'preact-router/match';

import { Login } from './Login.js'
import { RoomList } from './RoomList.js'
import { Invite } from './Invite.js'
import { Room } from './Room.js'
import { Register } from './Register.js'
import { authFetch, TokenStatus, logOut, getToken } from './Authentication.js'
import { Header } from './Header.js';
import { Profile } from './Profile.js';
import { InfoScreen } from './InfoScreen.js';
import { Access } from './Access.js';
import { AdminPage } from './AdminPage.js';
import { MediaSettings } from './MediaSettings.js';
import { WebSocketProvider } from './websocket/WebSocketProvider.js';
import { useCallback, useContext, useEffect } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext.js';
import { batch, effect } from "@preact/signals";

export const App = () => {
    const { design, profile, loggedIn, loginCompleted, registerWithInviteOnly, cozyMessage } = useContext(AppStateContext);

    const logoutUser = () => {
        logOut();
        loggedIn.value = false;
    }

    const fetchMisc = useCallback(() => {
        fetch("/api/misc").then((e) => e.json()).then((e) => {
            batch(() => {
                registerWithInviteOnly.value = e.registerWithInviteOnly;
                cozyMessage.value = !e.message ? "" : e.message
            });
        });
    }, [])

    const updateProfile = () => {
        authFetch("/api/profile").then(e => {
            switch (e) {
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    loginCompleted.value = true;
                    break;
                default:
                    e.json().then(e => {
                        batch(() => {
                            profile.value = {
                                username: e.username,
                                avatarUrl: e.avatarUrl,
                                admin: e.admin,
                                nickname: e.nickname,
                                nameColor: e.nameColor,
                                pingName: e.nickname.replace(/\s/g, '').toLowerCase(),
                                verified: (e.verified || e.admin)
                            };
                            loggedIn.value = true;
                            loginCompleted.value = true;
                        });
                    })
            }
        })
    }

    useEffect(() => {
        fetchMisc()
        updateProfile()
    }, []);

    const checkIfLoggedOut = () => {
        getToken().then(e => {
            switch (e) {
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    batch(() => {
                        profile.value = {
                            admin: false,
                            nickname: "Anonymous",
                            pingName: "anonymous"
                        }
                        loggedIn.value = false;
                    });
                default:
            }
        })
    }

    if (!(loginCompleted.value))
        return <div id="pagecontent" class={design.value}>
            <InfoScreen message={"Connecting to CozyCast..."} submessage={"If this takes too long please refresh"} />
        </div>

    return (
        <div id="pagecontent" class={design.value}>
            <Match path="/room/:">{({ matches, url }) => {
                if (!matches)
                    return <Header url={url} logout={logoutUser}></Header>
            }
            }
            </Match>
            <Router onChange={checkIfLoggedOut}>
                <RoomList path="/" profile={profile.value} loggedIn={loggedIn.value} />
                <WebSocketProvider path="/room/:roomId">
                    <Room />
                </WebSocketProvider>
                <Invite path="/invite/:code" />
                <Access path="/access/:code" />
                <Login path="/login/" logout={logoutUser} updateProfile={updateProfile} />
                <Register path="/register" updateProfile={updateProfile} />
                <Profile path="/profile" />
                <MediaSettings path="/settings" />
                <AdminPage path="/accounts" />
                <AdminPage path="/invites" />
                <AdminPage path="/permission" />
                <AdminPage path="/cozysettings" refreshMisc={fetchMisc} />
            </Router>
        </div>);
}
