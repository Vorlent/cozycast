import { Component, render, h, createRef } from 'preact'
import { Router } from 'preact-router'
import { Match } from 'preact-router/match';

import { Login } from './Login.js'
import { RoomList } from './RoomList.js'
import { Invite } from './Invite.js'
import { Room } from './Room.js'
import { Register } from './Register.js'
import { authFetch, TokenStatus, logOut, getToken } from './Authentication.js'
import { Header } from './Header.js';
import { Accounts } from './Accounts.js';
import { Profile } from './Profile.js';
import { InviteManager } from './InviteManager.js';
import { PermissionManager } from './PermissionManager.js';
import { InfoScreen } from './InfoScreen.js';
import { MiscSettings } from './MiscSettings.js';

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
    constructor(props) {
        super(props);
        this.state = {
            legacyDesign: localStorage.hasOwnProperty('legacyDesign') ? localStorage.getItem("legacyDesign") == 'true' : false,
            profile: {
                admin: false,
                nickname: "Anonymous",
                pingName: "anonymous"
            },
            loginCompleted: false,
            loggedIn: false,
            roomPerms: new Map(),
            inviteCode: undefined,
            registerWithInviteOnly: true,
            message: ""
        }
    }

    componentDidUpdate(){
        console.log(this.state);
    }

    logout = () => {
        logOut();
        this.setState({ loggedIn: false });
    }

    fetchMisc = () => {
        fetch("/api/misc").then((e) => e.json()).then((e) => {
            this.setState(state => { return { registerWithInviteOnly: e.registerWithInviteOnly, message: e.message == null ? "" : e.message } })
        });
    }

    login = () => {
        authFetch("/api/profile").then(e => {
            switch (e) {
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    this.setState({ loginCompleted: true })
                    break;
                default:
                    e.json().then(e => {
                        this.setState(state => {
                            return {
                                profile: {
                                    username: e.username,
                                    avatarUrl: e.avatarUrl,
                                    admin: e.admin,
                                    nickname: e.nickname,
                                    nameColor: e.nameColor,
                                    pingName: e.nickname.replace(/\s/g, '').toLowerCase(),
                                    verified: (e.verified || e.admin)
                                },
                                loggedIn: true
                            }
                        }
                        )
                    })
                    this.updatePermissions();
            }
        })
    }

    updatePermissions = () => {
        authFetch("/api/permission").then(e => e.json()).then(e => {
            const map = new Map(
                e.map(perm => {
                    return [perm.room, perm];
                }),
            );
            this.setState(state => {
                return {
                    loginCompleted: true,
                    roomPerms: map
                }
            })

        })
    }

    updateProfile = () => {
        authFetch("/api/profile").then(e => {
            switch (e) {
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    this.setState({ loginCompleted: true })
                    break;
                default:
                    e.json().then(e => {
                        this.setState(
                            {
                                profile: {
                                    username: e.username,
                                    avatarUrl: e.avatarUrl,
                                    admin: e.admin,
                                    nickname: e.nickname,
                                    pingName: e.nickname.replace(/\s/g, '').toLowerCase(),
                                    nameColor: e.nameColor
                                },
                                loggedIn: true
                            }
                        )
                    })
            }
        })
    }

    componentDidMount() {
        this.fetchMisc()
        this.login()
    }

    checkIfLoggedOut = () => {
        getToken().then(e => {
            switch (e) {
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    this.setState({
                        loggedIn: false, profile: {
                            admin: false,
                            nickname: "Anonymous",
                            pingName: "anonymous"
                        }
                    });
                default:
            }
        })
    }

    render(_, state) {
        if (!this.state.loginCompleted)
            return <div id="pagecontent" class={state.legacyDesign ? "legacyDesign" : "noiseBackground defaultDesign"}>
                <InfoScreen message={"Connecting to CozyCast..."} submessage={"If this takes too long please refresh"} legacyDesign={state.legacyDesign} />
            </div>
        return <div id="pagecontent" class={state.legacyDesign ? "legacyDesign" : "noiseBackground defaultDesign"}>
            <Match path="/">{({ matches, path, url }) => {
                if (url.startsWith('/room')) {
                    return;
                }
                return <Header loggedIn={this.state.loggedIn} profile={this.state.profile} logout={this.logout.bind(this)} registerWithInviteOnly={this.state.registerWithInviteOnly}></Header>
            }
            }
            </Match>
            <Router onChange={this.checkIfLoggedOut}>
                <RoomList path="/" profile={this.state.profile} roomPerms={state.roomPerms} loggedIn={state.loggedIn} message={this.state.message}/>
                <Room path="/room/:roomId" setAppState={this.setState.bind(this)} profile={this.state.profile} updateProfile={this.updateProfile.bind(this)} legacyDesign={this.state.legacyDesign}/>
                <Invite path="/invite/:code" updatePermissions={this.updatePermissions.bind(this)} setAppState={this.setState.bind(this)} />
                <Login path="/login/" loggedIn={this.state.loggedIn} logout={this.logout.bind(this)} login={this.login.bind(this)} inviteCode={this.state.inviteCode} />
                <Register path="/register" inviteCode={this.state.inviteCode} setAppState={this.setState.bind(this)}/>
                <Accounts path="/accounts" profile={this.state.profile} />
                <Profile path="/profile" profile={this.state.profile} setAppState={this.setState.bind(this)} updateProfile={this.updateProfile.bind(this)} />
                <InviteManager path="/invites" profile={this.state.profile} />
                <PermissionManager path="/permission" />
                <MiscSettings path="/cozysettings" message={this.state.message} registerWithInviteOnly={this.state.registerWithInviteOnly} updateMisc={this.fetchMisc.bind(this)}/>
            </Router>
        </div>
            ;
    }
}

render(<App />, document.body);
