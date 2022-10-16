import { h, Component, Fragment, render } from 'preact'
import moment from 'moment'
import kurentoUtils from 'kurento-utils'
import * as linkify from 'linkifyjs'
import Favico from './libs/favico-0.3.10.min.js'
import { route } from 'preact-router'

import { RoomSidebar } from './RoomSidebar.js'
import { ProfileModal } from './ProfileModal.js'
import { Userlist } from './Userlist.js'
import { VideoControls } from './VideoControls.js'
import { Controls } from './Controls.js'
import { SidebarState, WorkerStatus } from './index.js'
import { UserHoverName } from './UserHoverName.js'
import { typing, filterTyping, clearTyping } from './ChatInput.js'
import { TokenStatus, getToken } from './Authentication'
import { InfoScreen } from './InfoScreen.js';


var favicon = new Favico({
    animation:'none'
});

let idleTimer = null;
let idleState = false;
export function removeCursor(e) {
  let sidebar = document.getElementById("sidebar");
  let time = 2400;
  clearTimeout(idleTimer);
  if (idleState == true) {
    document.getElementById("pagetoolbar").classList.remove("hideToolbar");
    document.getElementById("videoBig").classList.remove("hideCursor");
    if(sidebar) {
        sidebar.classList.add("showChat");
        sidebar.classList.remove("hideChat");
    }
  }
  idleState = false;
  idleTimer = setTimeout(function() {
    if(document.fullscreenElement == null) return;
    document.getElementById("pagetoolbar").classList.add("hideToolbar");
    document.getElementById("videoBig").classList.add("hideCursor");
    let sidebar = document.getElementById("sidebar");
    if(sidebar) {
        sidebar.classList.add("hideChat");
        sidebar.classList.remove("showChat");
    }
    idleState = true;
  }, time);
}

export class Room extends Component {
    constructor(props) {
        super(props);
        //state setup
        let volume = parseInt(localStorage.getItem("volume"));
            if(!isNaN(volume)) volume = Math.max(Math.min(volume,100),0);
            else volume = 100;
        let roomId = props.roomId;
        this.state = {
            roomId: roomId,
            loggedIn: false,
            admin: false,
            profile: this.props.profile,
            personalPermissions:{
                remotePermission: false,
                imagePermission: false
            },
            permissions: {
                remotePermission: false,
                imagePermission: false
            },
            userlist: [],
            roomlist: [],
            chatMessages: [],
            newMessage: false,
            forceChatScroll: false,
            remote: false,
            remoteUsed: false,
            volume: volume,
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
                centerRemote: false,
                default_image_permission: true,
                default_remote_permission: true

            },
            session: null,
            windowTitle: "CozyCast: Low latency screen capture via WebRTC",
            historyMode: false,
            fullscreen: false,
            kicked: false,
            banned: localStorage.getItem("banned"),
            newMessageCount: 0,
            scheduleSidebar: false,
            scheduleMenu: "ROOM_AVAILABILITY",
            editSchedule: {
                days: []
            },
            userlistHidden: false,
            muteChatNotification: localStorage.hasOwnProperty('muteChatNotification') ?  localStorage.getItem("muteChatNotification") == 'true' : true,
            showUsernames: localStorage.hasOwnProperty('showUsernames') ?  localStorage.getItem("showUsernames") == 'true' : true,
            legacyDesign: localStorage.hasOwnProperty('legacyDesign') ?  localStorage.getItem("legacyDesign") == 'true' : false,
            muted: localStorage.hasOwnProperty('muted') ?  localStorage.getItem("muted") == 'true' : false,
            showIfMuted: localStorage.hasOwnProperty('showIfMuted') ?  localStorage.getItem("showIfMuted") == 'true' : false,
            userlistOnLeft: localStorage.hasOwnProperty('userlistOnLeft') ?  localStorage.getItem("userlistOnLeft") == 'true' : false,
            transparentChat: localStorage.hasOwnProperty('transparentChat') ?  localStorage.getItem("transparentChat") == 'true' : true
        };
        //bind function so they can be passed down as props
        this.pauseVideo = this.pauseVideo.bind(this)
        this.sendMessage = this.sendMessage.bind(this)
        this.updateRoomState = this.updateRoomState.bind(this)
    }

    websocket = null;
    webRtcPeer = null;

    mounted = true;

    //lets children change room state
    updateRoomState = this.setState;

    componentDidMount() {
        this.mounted = true;
        document.onvisibilitychange = () => {
            if(!document.hidden){
                this.setState({
                    newMessageCount: 0
                })
                favicon.badge(0);
            }
        }
        //if no websocket present create a new one
        if(!this.websocket) {
            getToken().then(e =>{
                let bearerToken = e;
                switch (e){
                    case TokenStatus.EXPIRED:
                        bearerToken = null;
                        break;
                    case TokenStatus.NO_TOKEN:
                        bearerToken = null;
                        break;
                    default:
                        break;
                }
                this.connect(this.props.roomId,bearerToken)
            })
        }
        
        window.onbeforeunload = () => {
            if(this.websocket) {
                this.websocket.close();
            }
        }

        document.addEventListener('fullscreenchange', (event) => {
            setTimeout(()=>{
                let messages = document.getElementById("messages");
                if(messages) {
                    messages.scrollTop = messages.scrollHeight;
                }},1)
            if(document.fullscreenElement == null){
                  document.getElementById("videoBig").removeEventListener('mousemove',removeCursor);
            };
            this.setState({
                fullscreen: document.fullscreenElement !== null
            })
        });
    }

    componentWillUnmount() {
        this.mounted = false;
        this.websocket.close();
    }

    componentDidUpdate() {
        document.title = this.state.windowTitle
    }

    pauseVideo = (e) => {
        let updatedPaused = !this.state.videoPaused;
        if(updatedPaused) {
            var videoElement = document.getElementById('video');
            videoElement.pause();
            this.webrtc_stop();
        } else {
            var videoElement = document.getElementById('video');
            videoElement.play();
            this.webrtc_start();
        }
        if(this.state.showIfMuted) {
            this.sendMessage({
                action : 'userMuted',
                muted: this.state.muted || updatedPaused
            });
        }
        this.setState({videoPaused: updatedPaused})
    }
    
    inactiveTimer = null;
    active = true;
    calcActiveStatus = (tabbedOut) => {
      let time = 5 * 60 * 1000;
      if(!tabbedOut){
        clearTimeout(this.inactiveTimer);
        this.inactiveTimer = null;
        if(!this.active){
            this.active = true;
            this.sendActivityStatus();
        }
      }
      else {
        if(this.inactiveTimer != null) return;
        this.inactiveTimer = setTimeout(() => {
          this.active = false;
          this.sendActivityStatus();
        }, time);
      }
    }
    
    sendActivityStatus = () => {
        this.sendMessage({
            action : 'userActivity',
            tabbedOut: !this.active,
        });
    }
    
    //deletes messages based on id and leaves a deleted in its place, the deleted symbol is client side only
    deletemessage = (parsedMessage) => {
        this.setState(state => {return {
            chatMessages:
                state.chatMessages.map(function(message) {
                    message.data = message.data.map(data => {
                            if(data.id == parsedMessage.id){
                                return {
                                    ...data,
                                    messages: [{
                                            href: "",
                                            message: "",
                                            type: "deleted"
                                        }],
                                    msg: "",
                                    deleted: true
                                }
                            }
                            return data;
                            });
                return message;
                }),
            newMessage: false
        }})
    }

    editmessage = (parsedMessage) => {
        var msg = parsedMessage.message || "";
        this.setState((state) => {return {
            chatMessages:
                state.chatMessages.map((message) => {
                    message.data = message.data.map(data => {
                            if(data.id == parsedMessage.id){
                                return {
                                    ...data,
                                    messages: this.parseMessage(parsedMessage),
                                    msg: msg,
                                    edited: true
                                }
                            }
                            return data;
                            });
                return message;
                }),
            newMessage: true
        }})
    }

    //fully deletes a message based on id
    completeDeletemessage = (parsedMessage) => {
        this.setState({chatMessages:    
            this.state.chatMessages.map(function(message) {
                if(message.data.length == 1 && message.data[0].id == parsedMessage.id) {return};
                message.data = message.data.filter(data => data.id != parsedMessage.id);
                return message;
            }).filter(x=>x),
            newMessage: false
        })
    }

    parseMessage = (parsedMessage) => {
        var msg = parsedMessage.message || "";
        var queuedMessages = [];
        const regex = new RegExp('^http.*\.(jpeg|jpg|gif|png)$');
        if(parsedMessage.type == "video") {
            queuedMessages.push({ "type": "video", "href": parsedMessage.image });
        } else if(parsedMessage.type == "image") {
            queuedMessages.push({ "type": "image", "href": parsedMessage.image });
        } else {
            var offset = 0;
            var urls = linkify.find(msg);
            var remaining = msg;
            urls.forEach(function(element) {
                if(element.start != offset) {
                    queuedMessages.push({ "type": "text", "message": remaining.substring(offset, element.start) });
                }
                if(element.type == "url") {
                        queuedMessages.push({ "type": "url", "href": element.href,"value": element.value });
                } else {
                    queuedMessages.push({ "type": "text", "message": element.value });
                }
                offset = element.end;
            });
            if(offset < remaining.length) {
                queuedMessages.push({ "type": "text", "message": remaining.substring(offset, remaining.length) });
            }
        }
        return queuedMessages;
    }

    /* parses the chatHistory in the messages array used in states. Called once upon entering a room. 
    Faster since it only calls setState once with the entire chat history*/
    chatHistory = (allMessages) => {
        var list = [];
        allMessages.slice().reverse().forEach(parsedMessage => {
            var msg = parsedMessage.message || "";
            var queuedMessages = this.parseMessage(parsedMessage);
            var date = moment(parsedMessage.timestamp);
            var timestamp = date.format('h:mm A');
            var lastMessage = null;
            if(list.length > 0) lastMessage = list[list.length-1];
            if(list.length > 0 && lastMessage.session == parsedMessage.session && lastMessage.anonymous == parsedMessage.anonymous) {
                lastMessage.data.push({messages: queuedMessages, id: parsedMessage.id, timestamp: timestamp,msg: msg, edited: parsedMessage.edited})
            } else {
                list.push({
                    username: parsedMessage.username,
                    nameColor: parsedMessage.nameColor,
                    session: parsedMessage.session,
                    anonymous: parsedMessage.anonymous,
                    data: [{messages: queuedMessages, id: parsedMessage.id, timestamp: timestamp, msg: msg, edited: parsedMessage.edited}]
                })
            }
        } )
        this.setState(state => {return {
            newMessage: true, 
            chatMessages: list,
            forceChatScroll: true
        }})
    }
    
    chatmessage = (parsedMessage, skip_notifications) => {
        var msg = parsedMessage.message || "";
        var queuedMessages = this.parseMessage(parsedMessage);

        this.setState((state) => {
            var list;
            var lastMessage;
            if(this.state.chatMessages.length > 0) lastMessage = state.chatMessages[state.chatMessages.length-1];
            if(this.state.chatMessages.length > 0 && lastMessage.session == parsedMessage.session && lastMessage.anonymous == parsedMessage.anonymous) {
                var lastMessageID = state.chatMessages[state.chatMessages.length-1].data[0].id;
                list = state.chatMessages.map((message) => {
                    if(message.data[0].id === lastMessageID){
                        const updatedMessage = {
                            ...message,
                            data: [...message.data,{messages: queuedMessages, id: parsedMessage.id, timestamp:moment(parsedMessage.timestamp).format('h:mm A'),msg: msg, edited: parsedMessage.edited}]
                        }
                        return updatedMessage;
                    }
                    return message;
                })
            } else {
                list = [...state.chatMessages, {
                    username: parsedMessage.username,
                    session: parsedMessage.session,
                    nameColor: parsedMessage.nameColor,
                    anonymous: parsedMessage.anonymous,
                    data: [{messages: queuedMessages, id: parsedMessage.id, timestamp:moment(parsedMessage.timestamp).format('h:mm A'),msg: msg, edited: parsedMessage.edited}]
                }]
            };
            return {
                newMessage: true, 
                chatMessages: list
            }
        }
        )

        if(skip_notifications) {
            return
        }

        var lowerCaseMsg = msg.toLowerCase()
        var pattern = "@" + this.props.profile.nickname.toLowerCase()
        var mentionPos = lowerCaseMsg.indexOf(pattern)
        var lookahead = lowerCaseMsg.substring(mentionPos, (pattern + " ").length).trim()
        var mention = lookahead == pattern
        if (this.state.historyMode || mention || !this.state.muteChatNotification && document.hidden && parsedMessage.session !== this.state.session) {
            var audio = new Audio('/audio/pop.wav');
            audio.play();
        }

        if(document.hidden) {
            this.setState({newMessageCount: this.state.newMessageCount + 1 })
            favicon.badge(this.state.newMessageCount + 1);
        }

    }
    
    join = (parsedMessage) => {
        this.leave(parsedMessage)
        this.setState(state => {return {
            userlist: [...state.userlist, {
                username: parsedMessage.username,
                url: parsedMessage.url,
                session: parsedMessage.session,
                remote: false,
                lastTimeSeen: moment(parsedMessage.lastTimeSeen).format('h:mm A'),
                active: parsedMessage.active,
                muted: parsedMessage.muted,
                nameColor: parsedMessage.nameColor,
                anonymous: parsedMessage.anonymous
            }]
        }})
    }

    updateUser = (parsedMessage) => {
        this.setState(state => { return {
            userlist: state.userlist.map(function(element) {
                if(element.session == parsedMessage.session) {
                    const updatedElement = {
                        ...element,
                        active: parsedMessage.active,
                        lastTimeSeen:  moment(parsedMessage.lastTimeSeen).format('h:mm A'),
                        username: parsedMessage.username,
                        url: parsedMessage.url,
                        nameColor: parsedMessage.nameColor,
                        muted: parsedMessage.muted
                    }
                    return updatedElement;
                }
                return element;
            })
        }})
    }

    loadUsers = (parseMessage) => {
        let users = parseMessage.users.map(user => {return {
                username: user.username,
                url: user.url,
                session: user.session,
                remote: user.remote,
                lastTimeSeen: moment(user.lastTimeSeen).format('h:mm A'),
                active: user.active,
                muted: user.muted,
                nameColor: user.nameColor,
                anonymous: user.anonymous
            }});
        this.setState((state) => { return {userlist: users}})
    }
    
    updateActivity = (parsedMessage) => {
        this.setState(state => { return {
            userlist: state.userlist.map(function(element) {
                if(element.session == parsedMessage.session) {
                    const updatedElement = {
                        ...element,
                        active: parsedMessage.active,
                        lastTimeSeen:  moment(parsedMessage.lastTimeSeen).format('h:mm A')
                    }
                    return updatedElement;
                }
                return element;
            })
        }})
    }
    
    updateMuted = (parsedMessage) => {
        this.setState(state => {return {
            userlist: state.userlist.map(function(element) {
                if(element.session == parsedMessage.session) {
                    const newElement = {
                        ...element,
                        muted:  parsedMessage.muted
                    }
                    return newElement;
                }
                return element;
            })
        }})
    }
    
    changeusername = (parsedMessage) => {
        this.setState(state => {return{
            userlist: state.userlist.map(function(element) {
                if(element.session == parsedMessage.session) {
                    return {
                        ...element,
                        username: parsedMessage.username
                    }
                }
                return element;
            }),
            chatMessages: state.chatMessages.map(function(message) {
                if(message.session == parsedMessage.session)
                    return {
                        ...message,
                        username: parsedMessage.username
                    }
                return message;
            })
        }})
    }
    
    changeprofilepicture = (parsedMessage) => {
        this.setState(state => {return {
            userlist: state.userlist.map(function(element) {
                if(element.session == parsedMessage.session) {
                    return {
                        ...element,
                        url: parsedMessage.url
                    }
                }
                return element;
            })
            }}
        )
    }
    
    leave = (parsedMessage) => {
        this.setState(state => {return{
            userlist: state.userlist.filter(function(element) {
                return element.session != parsedMessage.session;
            })
        }})
        filterTyping(parsedMessage.session);
    }
    
    ban = (parsedMessage) => {
        if(parsedMessage.session == this.state.session) {
            localStorage.setItem("banned", parsedMessage.expiration);
            this.setState({
                banned: parsedMessage.expiration
            })
            this.websocket.close();
        }
    }

    roomSettings = (parsedMessage) => {
        this.setState(state => {
            let a = 'public';
            if(parsedMessage.accountOnly) a = 'authenticated';
            if(parsedMessage.inviteOnly) a = 'invite';
            return{
            roomSettings: {
                ...this.roomSettings,
                accessType: a,
                centerRemote: parsedMessage.centerRemote,
                default_remote_permission: parsedMessage.default_remote_permission,
                default_image_permission: parsedMessage.default_image_permission
            },
            permissions: {
                remotePermission: state.personalPermissions.remotePermission || parsedMessage.default_remote_permission,
                imagePermission: state.personalPermissions.imagePermission || parsedMessage.default_image_permission
            }
        }})
    }
    
    isBanned = () => {
        if(this.state.banned == null) {
            return false;
        }
        if(this.state.banned == "unlimited") {
            return true
        } else {
            var expiration = new Date(this.state.banned)
            if(new Date().getTime() < expiration.getTime()) {
                return true
            }
        }
        return false
    }

    unauthorized = (parsedMessage) => {
        switch(parsedMessage.message){
            default:
                route('/',true);
                break;
        }
    }
    
    keepAlive;
    connect = (room,bearerToken) => {
        if(this.isBanned()) {
            return;
        }
        var wsProtocol = 'wss'
        if(document.location.protocol != 'https:') {
            wsProtocol = 'ws'
        }
        this.websocket = new WebSocket(wsProtocol + '://' + location.host + '/player/' + room);
        this.websocket.onmessage = (message) => {
            var parsedMessage = JSON.parse(message.data);
            console.log(parsedMessage)
            switch (parsedMessage.action) {
                case 'keepalive':
                    break;
                case 'authenticated':
                    this.setState(state => {return {
                        admin: parsedMessage.admin,
                        personalPermissions: {
                            remotePermission: parsedMessage.remotePermission,
                            imagePermission: parsedMessage.imagePermission
                        },
                        permissions: {
                            remotePermission: parsedMessage.remotePermission || state.roomSettings.default_remote_permission,
                            imagePermission: parsedMessage.imagePermission || state.roomSettings.default_image_permission
                        }
                    }})
                    this.keepAlive = setInterval(() => {
                        this.sendMessage({
                            action : 'keepalive',
                        });
                    }, 30000);
                    this.webrtc_start()
                    break
                case 'ban':
                    this.ban(parsedMessage)
                    break;
                case 'room_settings':
                    this.roomSettings(parsedMessage)
                    break;
                case 'unauthorized':
                    this.unauthorized(parsedMessage)
                    break;
                case 'session_id':
                    this.setState(state => {return {
                        session: parsedMessage.session
                    }})
                    break;
                case 'startResponse':
                    this.startResponse(parsedMessage);
                    break;
                case 'error':
                    console.log('Error from server: ' + parsedMessage.message);
                    break;
                case 'typing':
                    typing(parsedMessage);
                    break;
                case 'userActivityChange':
                    this.updateActivity(parsedMessage);
                    break;
                case 'userMutedChange':
                    this.updateMuted(parsedMessage);
                    break;
                case 'chat_history':
                    if(parsedMessage.messages) {
                        this.chatHistory(parsedMessage.messages)
                    }
                    break;
                case 'receivemessage':
                    this.chatmessage(parsedMessage);
                    break;
                case 'deletemessage':
                    this.deletemessage(parsedMessage);
                    break;
                case 'editmessage':
                    this.editmessage(parsedMessage);
                    break;
                case 'changeusername':
                    this.changeusername(parsedMessage);
                    break;
                case 'update_user':
                    this.updateUser(parsedMessage);
                    break;
                case 'changeprofilepicture':
                    this.changeprofilepicture(parsedMessage);
                    break;
                case 'load_users':
                    this.loadUsers(parsedMessage);
                    break;
                case 'join':
                    this.join(parsedMessage);
                    break;
                case 'leave':
                    this.leave(parsedMessage);
                    break;
                case 'drop_remote':
                    this.setState((state) =>  {return {
                        remote: false,
                        remoteUsed: false,
                        userlist: state.userlist.map((user) => {
                            if(user.session == parsedMessage.session) {
                                return {
                                    ...user,
                                    remote: false
                                }
                            }
                            return user;
                        })
                    }})
                    break;
                case 'pickup_remote':
                    this.setState((state) =>  {return {
                        remote: parsedMessage.has_remote,
                        remoteUsed: !parsedMessage.has_remote,
                        userlist: state.userlist.map((user) => {
                            return {
                                ...user,
                                remote: user.session == parsedMessage.session
                            }
                        })
                    }})
                    break;
                case 'window_title':
                    this.setState({windowTitle: parsedMessage.title})
                    break;
                case 'iceCandidate':
                    this.webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
                        if (error) {
                            console.log('Error iceCandidate: ' + error);
                            return;
                        } else {
                            console.log("Successful iceCandidate")
                        }
                    });
                    break;
                default:
                    console.log('Unknown action: ', parsedMessage);
            }
        }
        this.websocket.onclose = (event) => {
            clearTyping();
            this.webrtc_stop()
            clearInterval(this.keepAlive)
            this.keepAlive = null;
            this.setState(state => {return {
                userlist: [],
                chatMessages: [],
                remote: false
            }})
            if(this.mounted) setTimeout(() => this.connect(room,bearerToken), 1500)
        }
      
        this.websocket.onopen = (event) => {
            setTimeout(() => {
                this.start(bearerToken);
                document.addEventListener("visibilitychange", () => {
                    this.calcActiveStatus(document.visibilityState != "visible");
                  });
            }, 300);
        };

        this.setState(state => {return {
            roomId: room
        }})
    }
    
    start = (bearerToken) => {
        this.sendMessage({
            action : 'join',
            token: bearerToken,
            muted: (this.state.showIfMuted ? this.state.muted : false)
        });
    }
    
    webrtc_start = () => {
        fetch("/turn/credential").then((e) => e.json()).then((iceServer) => {
            var options = {
                remoteVideo : document.getElementById("video"),
                mediaConstraints : {
                    audio : true,
                    video : true
                },
                onicecandidate : this.onIceCandidate,
                configuration: {
                    iceServers: [iceServer]
                }
            }
            this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
                (error) => {
                    if (error) {
                        console.log(error);
                        return;
                    }
                    this.webRtcPeer.generateOffer(this.onOffer);
                })
        });
    }
    
    webrtc_stop = () => {
        if (this.webRtcPeer) {
            this.webRtcPeer.dispose();
            this.webRtcPeer = null;
        }
    }
    
    onOffer = (error, sdpOffer) => {
        if (error) {
            console.log(error);
            return;
        }
      
        this.sendMessage({
            action : 'start',
            sdpOffer : sdpOffer
        });
    }
    
    onIceCandidate = (candidate) => {
        this.sendMessage({
            action : 'onIceCandidate',
            candidate : candidate
        });
    }
    
    startResponse = (message) => {
        this.webRtcPeer.processAnswer(message.sdpAnswer, (error) => {
            if (error) {
                console.log(error);
                return;
            }
        });
        var settings = message.videoSettings
        this.setState(state => {return {
            viewPort: { width: settings.desktopWidth,
                height: settings.desktopHeight
            },
            roomSettings: {
                ...this.state.roomSettings,
                desktopResolution: settings.desktopHeight,
                streamResolution: settings.scaleHeight,
                framerate: settings.framerate,
                videoBitrate: settings.videoBitrate,
                audioBitrate: settings.audioBitrate
            }
        }}
        )
    }
    
    sendMessage = (message) => {
        this.websocket.send(JSON.stringify(message));
    }

    render({ roomId }, state) {
    return <Fragment>
            {this.isBanned() && <InfoScreen message={'You are banned'} submessage={`until ${state.banned}`}/>}
            {!this.isBanned() && <Fragment>
                {!state.userlistHidden && (state.fullscreen || state.userlistOnLeft) && <div><Userlist showUsernames={state.showUsernames} userlist={state.userlist} isLeft={true} fullscreen={state.fullscreen} hasRemote={state.remote} updateRoomState={this.updateRoomState}/></div>}
                <div id="videoWrapper" class="videoWrapper">
                    <VideoControls state={state} sendMessage={this.sendMessage} pauseVideo={this.pauseVideo} updateRoomState={this.updateRoomState} />
                    <div id="pagetoolbar" class={state.fullscreen ? "toolbarFullscreen" : ""}>
                        <Controls state={state} sendMessage={this.sendMessage} updateRoomState={this.updateRoomState} startVideo={this.webrtc_start.bind(this)} stopVideo={this.webrtc_stop.bind(this)} permissions={state.permissions}/>
                        {!state.userlistHidden && !state.fullscreen && !state.userlistOnLeft && <Userlist showUsernames={state.showUsernames} userlist={state.userlist} isLeft={false} updateRoomState={this.updateRoomState}/>}
                    </div>
                </div>
                {(state.roomSidebar != SidebarState.NOTHING) && <RoomSidebar state={state} sendMessage={this.sendMessage} updateRoomState={this.updateRoomState} profile={this.props.profile} permissions={state.permissions}/>}
                {state.profileModal && <ProfileModal state={state} sendMessage={this.sendMessage} updateRoomState={this.updateRoomState} setAppState={this.props.setAppState} profile={this.props.profile}/>}
                {state.hoverText && <UserHoverName state={state}/>}
                </Fragment>}
        </Fragment>
    }
}
