import { Component, render, h, createRef } from 'preact'
import { Router } from 'preact-router'
import { Match } from 'preact-router/match';

import { Login } from './Login.js'
import { RoomList } from './RoomList.js'
import { Invite } from './Invite.js'
import { Room } from './Room.js'
import { Register } from './Register.js'
import { authFetch, TokenStatus, logOut, getToken} from './Authentication.js'
import { Header } from './Header.js';
import { Accounts } from './Accounts.js';
import { Profile } from './Profile.js';
import { InviteManager } from './InviteManager.js';
import { PermissionManager } from './PermissionManager.js';

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
            legacyDesign: localStorage.hasOwnProperty('legacyDesign') ?  localStorage.getItem("legacyDesign") == 'true' : false,
            profile : {
                admin: false
            },
            loginCompleted: false,
            loggedIn: false,
            roomPerms: new Map()
        }
    }

    logout = () => {
        logOut();
        this.setState({loggedIn: false});
    }

    login = () => {
        authFetch("/api/profile").then(e => {
            switch(e){
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    this.setState({loginCompleted: true})
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
                                nameColor: e.nameColor
                            }, 
                                loggedIn: true}
                            )
                    }) 
                    authFetch("/api/permission").then(e => e.json()).then(e =>{
                        const map = new Map(
                            e.map(perm => {
                              return [perm.room, perm];
                            }),
                        );
                        this.setState({
                            loginCompleted: true,
                            roomPerms: map
                        })

                    } )
            }
        })
    }

    updateProfile = () => {
        authFetch("/api/profile").then(e => {
            switch(e){
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    this.setState({loginCompleted: true})
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
                                nameColor: e.nameColor
                            }, 
                                loggedIn: true}
                            )
                    })
            }
        })
    }

    componentDidMount(){
        this.login()
    }

    componentDidUpdate(){
        console.log(this.state);
    }

    checkIfLoggedOut = () => {
        getToken().then(e => {
            switch(e){
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    this.setState({loggedIn: false, profile: {
                        admin: false
                    }});
                default:
            }
        })
    }

    render(_, state) {
        if(!this.state.loginCompleted) return <div>logging in</div>

        return <div id="pagecontent" class={state.legacyDesign ? "legacyDesign" : "noiseBackground defaultDesign"}>
            <Match path="/">{({ matches, path, url }) => {
                if(url.startsWith('/room')) {
                    return;}
                return <Header loggedIn={this.state.loggedIn} profile={this.state.profile} logout={this.logout.bind(this)}></Header>
            }
            }
            </Match>
                <Router onChange={this.checkIfLoggedOut}>
                    <RoomList path="/" profile={this.state.profile} roomPerms={state.roomPerms} loggedIn={state.loggedIn}/>
                    <Room path="/room/:roomId" setAppState={this.setState.bind(this)} profile={this.state.profile}/>
                    <Invite path="/invite/:code"/>
                    <Login path="/login/" loggedIn={this.state.loggedIn} logout={this.logout.bind(this)} login={this.login.bind(this)}/>
                    <Register path="/register"/>
                    <Accounts path="/accounts" profile={this.state.profile}/>
                    <Profile path="/profile" profile={this.state.profile} setAppState={this.setState.bind(this)} updateProfile={this.updateProfile.bind(this)}/>
                    <InviteManager path="/invites" profile={this.state.profile}/>
                    <PermissionManager path="/permission"/>
                </Router>
            </div> 
        ;
    }
}

render(<App/>, document.body);
