import { h } from 'preact'
import Favico from '../libs/favico-0.3.10.min.js'
import { useEffect, useMemo, useCallback, useRef, useContext } from 'preact/hooks';
import { batch } from "@preact/signals";
import * as linkify from 'linkifyjs'
import moment from 'moment'
import { TokenStatus, getToken } from '../Authentication'
import { WebSocketContext } from './WebSocketContext'
import { createWebsocketState } from './createWebsocketState';
import { AppStateContext } from '../appstate/AppStateContext';
import kurentoUtils from 'kurento-utils'
import { route } from 'preact-router'


//SETTINGS

const roomSettings = (parsedMessage, roomSettings) => {
    let a = 'public';
    if (parsedMessage.accountOnly) a = 'authenticated';
    if (parsedMessage.inviteOnly) a = 'invite';
    roomSettings.value = {
        ...roomSettings.value,
        ...parsedMessage,
        accessType: a
    }
}

const nextRestartAvailable = (parsedMessage) => {
    alert(`Restart failed. VM has been restarted recently.\nNext restart available at ${moment(parsedMessage.time).format('h:mm A')}`)
}


//MESSAGES

const parseMessage = (parsedMessage, pingName) => {
    var pinged = 0;
    var msg = parsedMessage.message || "";
    var queuedMessages = [];
    const regexp = /(@[^ \n@]*)|([^@]*)/g;

    const parsePing = (remaining, start, end) => {
        const matches = remaining.substring(start, end).matchAll(regexp);
        for (const match of matches) {
            const text = match[0];
            if (!text) continue;
            if (text.length == 1 || !text.startsWith('@')) {
                queuedMessages.push({ "type": "text", "message": text });
            }
            else {
                let pingTarget = text.substr(1).toLowerCase();
                if (pingName == pingTarget) pinged++;
                queuedMessages.push({ "type": "ping", "message": text, "target": pingTarget });
            }
        }
    }

    const pushToQueue = (type, data) => {
        queuedMessages.push({ type, ...data });
    };

    const { type, image } = parsedMessage;

    switch (type) {
        case "whisper":
            pushToQueue("whisper", { message: msg });
            break;
        case "video":
            pushToQueue("video", { href: image });
            break;
        case "image":
            pushToQueue("image", { href: image });
            break;
        default:
            var urls = linkify.find(msg);
            var offset = 0;
            urls.forEach((element) => {
                if (element.start != offset) {
                    parsePing(msg, offset, element.start);
                }
                if (element.type == "url") {
                    pushToQueue("url", { href: element.href, value: element.value });
                } else {
                    pushToQueue("text", { message: element.value });
                }
                offset = element.end;
            });
            if (offset < msg.length) {
                parsePing(msg, offset, msg.length);
            }
    }
    return { queuedMessages, pinged };
}

const chatHistory = (allMessages, valueContainer) => {
    if (!allMessages) return;

    valueContainer.value = allMessages.slice().reverse().reduce((list, currentMessage) => {
        const { queuedMessages } = parseMessage(currentMessage, '');
        const timestamp = moment(currentMessage.timestamp).format('h:mm A');
        const lastMessage = list[list.length - 1];
        const data = {
            messages: queuedMessages,
            id: currentMessage.id,
            timestamp,
            msg: currentMessage.message || "",
            edited: currentMessage.edited
        }
        const sameUser = lastMessage &&
            lastMessage.session === currentMessage.session &&
            lastMessage.anonymous === currentMessage.anonymous;

        if (sameUser) {
            lastMessage.data.push(data);
        } else {
            list.push({
                username: currentMessage.username,
                nameColor: currentMessage.nameColor,
                session: currentMessage.session,
                anonymous: currentMessage.anonymous,
                data: [data]
            });
        }
        return list;
    }, []);
}

const chatMessage = (parsedMessage, chatMessages, newMessageCount, session, profile, userSettings, favicon) => {
    const msg = parsedMessage.message || "";
    const { queuedMessages, pinged } = parseMessage(parsedMessage, profile.value.pingName);

    const lastMessage = chatMessages.value[chatMessages.value.length - 1];
    const data = {
        messages: queuedMessages,
        id: parsedMessage.id,
        timestamp: moment(parsedMessage.timestamp).format('h:mm A'),
        msg,
        edited: parsedMessage.edited
    }

    const sameUser = lastMessage &&
        lastMessage.session === parsedMessage.session &&
        lastMessage.anonymous === parsedMessage.anonymous;
    if (sameUser) {
        const lastMessageID = lastMessage.data[0].id;
        chatMessages.value = chatMessages.value.map(message => {
            if (message.data[0].id === lastMessageID) {
                return {
                    ...message,
                    data: [
                        ...message.data,
                        data
                    ]
                };
            }
            return message;
        });
    } else {
        chatMessages.value = ([...chatMessages.value, {
            username: parsedMessage.username,
            session: parsedMessage.session,
            nameColor: parsedMessage.nameColor,
            anonymous: parsedMessage.anonymous,
            data: [data],
        }]);
    }

    if (pinged > 0) {
        rapidPing(pinged);
    }
    else if (!userSettings.value.muteChatNotification && document.hidden && parsedMessage.session !== session.value) {
        var audio = new Audio('/audio/pop.wav');
        audio.play();
    }
    if (document.hidden) {
        newMessageCount.value = newMessageCount.value + 1;
        favicon.current.badge(newMessageCount.value);
    }
}

const deleteMessage = (parsedMessage, chatMessages) => {
    chatMessages.value = chatMessages.value.map(function (message) {
        let modified = false;
        message.data = message.data.map(data => {
            if (data.id == parsedMessage.id) {
                modified = true;
                return {
                    ...data,
                    messages: [{
                        href: "", message: "", type: "deleted"
                    }],
                    msg: "",
                    deleted: true
                }
            }
            return data;
        });
        if (modified) return { ...message }
        return message;
    })
}

const editMessage = (parsedMessage, chatMessages) => {
    var msg = parsedMessage.message || "";
    const { queuedMessages } = parseMessage(parsedMessage)
    chatMessages.value = chatMessages.value.map((message) => {
        let modified = false;
        message.data = message.data.map(data => {
            if (data.id == parsedMessage.id) {
                modified = true;
                return {
                    ...data,
                    messages: queuedMessages,
                    msg: msg,
                    edited: true
                }
            }
            return data;
        });
        if (modified) return { ...message }
        return message;
    })
}

let tempCount = 0;
const pushTempMessage = (tempMessage, chatMessages) => {
    chatMessages.value = [...chatMessages.value, {
        id: 'tempMessage-ID-' + tempCount,
        tempMessage: true,
        timestamp: moment().format('h:mm A'),
        content: tempMessage,
        data: [{ id: 'tempMessage-ID:' + tempCount }]
    }]
    tempCount += 1;
}

const typing = (parsedMessage, typingUsers) => {
    if (parsedMessage.state == "start") {
        var typingUser = typingUsers.value.find(e => e.session == parsedMessage.session)
        if (typingUser) {
            typingUser.lastTypingTime = moment()
        }
        else {
            typingUsers.value = [...typingUsers.value, {
                username: parsedMessage.username,
                session: parsedMessage.session,
                lastTypingTime: moment()
            }]
        }
    }
    else if (parsedMessage.state == "stop") {
        typingUsers.value = typingUsers.value.filter(function (user) {
            return user.session != parsedMessage.session;
        });
    }
}

//USERLIST

const loadUsers = (parseMessage, userlist, pingLookup) => {
    let pingLookupTable = {};
    let users = parseMessage.users.map(user => {
        var userLower = user.username.toLowerCase().replace(/\s/g, '');
        pingLookupTable[userLower] = pingLookupTable[userLower] > 0 ? pingLookupTable[userLower] + 1 : 1;
        return {
            username: user.username,
            url: user.url,
            session: user.session,
            remote: user.remote,
            lastTimeSeen: moment(user.lastTimeSeen).format('h:mm A'),
            userEntryTime: moment(user.userEntryTime, "YYYY-MM-DDTHH:mm:ssZ"),
            active: user.active,
            muted: user.muted,
            nameColor: user.nameColor,
            anonymous: user.anonymous
        }
    });
    batch(() => {
        userlist.value = users;
        pingLookup.value = pingLookupTable;
    });
}

const join = (parsedMessage, userlist, pingLookup) => {
    var targetName = parsedMessage.username.toLowerCase().replace(/\s/g, '');
    batch(() => {
        userlist.value = [...userlist.value, {
            username: parsedMessage.username,
            url: parsedMessage.url,
            session: parsedMessage.session,
            remote: false,
            lastTimeSeen: moment(parsedMessage.lastTimeSeen).format('h:mm A'),
            userEntryTime: moment(parsedMessage.userEntryTime, "YYYY-MM-DDTHH:mm:ssZ"),
            active: parsedMessage.active,
            muted: parsedMessage.muted,
            nameColor: parsedMessage.nameColor,
            anonymous: parsedMessage.anonymous
        }];
        let lookupUserCount = pingLookup.value[targetName];
        pingLookup.value = {
            ...pingLookup.value,
            [targetName]: lookupUserCount > 0 ? lookupUserCount + 1 : 1
        }
    })
}

const leave = (parsedMessage, userlist, pingLookup) => {
    batch(() => {
        let username;
        userlist.value = userlist.value.filter((user) => {
            let isRemovedUser = user.session == parsedMessage.session;
            if (isRemovedUser) username = user.username;
            return !isRemovedUser;
        });
        let usernamePing = username.toLowerCase().replace(/\s/g, '');
        pingLookup.value = {
            ...pingLookup.value,
            [usernamePing]: pingLookup.value[usernamePing] - 1
        }
    })
}

const updateUser = (parsedMessage, userlist, pingLookup) => {
    var oldUsername;
    var newUsername = parsedMessage.username.toLowerCase().replace(/\s/g, '');
    batch(() => {
        userlist.value = userlist.value.map((element) => {
            if (element.session == parsedMessage.session) {
                const updatedElement = {
                    ...element,
                    active: parsedMessage.active,
                    lastTimeSeen: moment(parsedMessage.lastTimeSeen).format('h:mm A'),
                    username: parsedMessage.username,
                    url: parsedMessage.url,
                    nameColor: parsedMessage.nameColor,
                    muted: parsedMessage.muted
                }
                oldUsername = element.username.toLowerCase().replace(/\s/g, '');
                return updatedElement;
            }
            return element;
        })
        let newUsernameCount = pingLookup.value[newUsername];
        pingLookup.value = {
            ...pingLookup.value,
            [oldUsername]: pingLookup.value[oldUsername] - 1,
            [newUsername]: newUsernameCount > 0 ? newUsername != oldUsername ? newUsernameCount + 1 : newUsernameCount : 1
        }
    })
}

const updateActivity = (parsedMessage, userlist) => {
    userlist.value = userlist.value.map(function (user) {
        if (user.session == parsedMessage.session) {
            const updatedUser = {
                ...user,
                active: parsedMessage.active,
                lastTimeSeen: moment(parsedMessage.lastTimeSeen).format('h:mm A')
            }
            return updatedUser;
        }
        return user;
    })
}

const updateMuted = (parsedMessage, userlist) => {
    userlist.value = userlist.value.map(function (user) {
        if (user.session == parsedMessage.session) {
            const updatedUser = {
                ...user,
                muted: parsedMessage.muted
            }
            return updatedUser;
        }
        return user;
    })
}


//REMOTE

const dropRemote = (parsedMessage, userlist, remoteInfo) => {
    batch(() => {
        remoteInfo.value = {
            remote: false,
            remoteUsed: false
        };
        userlist.value = userlist.value.map((user) => {
            if (user.session == parsedMessage.session) {
                return {
                    ...user,
                    remote: false
                }
            }
            return user;
        })
    })
}

const pickupRemote = (parsedMessage, userlist, remoteInfo) => {
    batch(() => {
        remoteInfo.value = {
            remote: parsedMessage.has_remote,
            remoteUsed: !parsedMessage.has_remote,
        };
        userlist.value = userlist.value.map((user) => {
            return {
                ...user,
                remote: user.session == parsedMessage.session
            }
        })
    })
}


//ACCOUNT
const authentication = (parsedMessage, authorization, personalPermissions) => {
    batch(() => {
        authorization.value = {
            admin: parsedMessage.admin,
            anonymous: parsedMessage.anonymous,
            trusted: parsedMessage.trusted
        }
        personalPermissions.value = {
            remotePermission: parsedMessage.remotePermission,
            imagePermission: parsedMessage.imagePermission
        }
    });
}

const updatePermission = (parsedMessage, authorization, personalPermissions) => {
    batch(() => {
        authorization.value = {
            ...authorization.value,
            trusted: parsedMessage.trusted
        }
        personalPermissions.value = {
            remotePermission: parsedMessage.remotePermission,
            imagePermission: parsedMessage.imagePermission
        }
    });
}

const unauthorized = (parsedMessage) => {
    switch (parsedMessage.message) {
        default:
            route('/', true);
            break;
    }
}

const ban = (parsedMessage, socketRef, roomId, banned) => {
    localStorage.setItem("banned-" + roomId.value, parsedMessage.expiration);
    banned.value = parsedMessage.expiration;
    if (socketRef.current) {
        socketRef.current.close();
    }
}

const rapidPing = (times) => {
    if (times > 0) {
        var audio = new Audio('/audio/pop.wav');
        audio.play();
        setTimeout(() => rapidPing(times - 1), 50);
    }
}

//VIDEOSTREAM
const webrtc_start = (webRtcPeer, onIceCandidate, onOffer) => {
    fetch("/turn/credential").then((e) => e.json()).then((iceServer) => {
        var options = {
            remoteVideo: document.getElementById("video"),
            mediaConstraints: {
                audio: true,
                video: true
            },
            onicecandidate: onIceCandidate,
            configuration: {
                iceServers: [iceServer]
            }
        }
        webRtcPeer.current = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
            (error) => {
                if (error) {
                    console.log(error);
                    return;
                }
                webRtcPeer.current.generateOffer(onOffer);
            })
    });
}

const webrtc_stop = (webRtcPeer) => {
    if (webRtcPeer.current) {
        webRtcPeer.current.dispose();
        webRtcPeer.current = null;
    }
}

const startResponse = (message, webRtcPeer, viewPort, roomSettings) => {
    webRtcPeer.current.processAnswer(message.sdpAnswer, (error) => {
        if (error) {
            console.log(error);
            return;
        }
    });
    var settings = message.videoSettings
    batch(() => {
        viewPort.value = {
            width: settings.desktopWidth,
            height: settings.desktopHeight
        };
        roomSettings.value = {
            ...roomSettings.value,
            desktopResolution: settings.desktopHeight,
            streamResolution: settings.scaleHeight,
            framerate: settings.framerate,
            videoBitrate: settings.videoBitrate,
            audioBitrate: settings.audioBitrate
        }
    })
}


export const WebSocketProvider = ({ roomId, children, matches }) => {

    const { profile, windowTitle, userSettings, muted, loggedIn } = useContext(AppStateContext);
    const socketRef = useRef(null);
    const webRtcPeerRef = useRef(null);
    const keepAlive = useRef();
    const state = useMemo(() => createWebsocketState(), []);
    const favicon = useRef(new Favico({ animation: 'none' }));

    useEffect(() => {
        state.roomId.value = roomId;
        getToken().then(e => {
            let bearerToken = e;
            switch (e) {
                case TokenStatus.EXPIRED:
                    bearerToken = undefined;
                    break;
                case TokenStatus.NO_TOKEN:
                    bearerToken = undefined;
                    break;
                default:
                    break;
            }
            if (!loggedIn.value) {
                const banned = localStorage.getItem("banned-" + roomId);
                if (banned == "unlimited") {
                    state.banned.value = "unlimited";
                } else {
                    var expiration = new Date(banned)
                    if (new Date().getTime() < expiration.getTime()) {
                        localStorage.removeItem("banned-" + roomId);
                        state.banned.value = null;
                    }
                }
                if(state.banned.value) return;
            }
            console.log('Provider: useEffect');
            var wsProtocol = 'wss'
            if (document.location.protocol != 'https:') {
                wsProtocol = 'ws'
            }
            const url = wsProtocol + '://' + location.host + '/player/' + roomId;
            const ws = new WebSocket(url);

            ws.onopen = () => {
                socketRef.current = ws;
                sendMessage({
                    action: 'join',
                    token: bearerToken,
                    access: matches.access,
                    muted: userSettings.value.showIfMuted && muted.value
                })
                document.addEventListener('visibilitychange', handleVisibilityChange);
            };

            ws.onmessage = (event) => {
                const parsedMessage = JSON.parse(event.data);
                switch (parsedMessage.action) {
                    case 'keepalive':
                        break;

                    //Settings events
                    case 'room_settings':
                        roomSettings(parsedMessage, state.roomSettings);
                        break;
                    case 'nextRestartAvailable':
                        nextRestartAvailable(parsedMessage);
                        break;
                    case 'window_title':
                        windowTitle.value = parsedMessage.title;
                        break;

                    //Account events
                    case 'authenticated':
                        authentication(parsedMessage, state.authorization, state.personalPermissions);
                        keepAlive.current = setInterval(() => {
                            sendMessage({
                                action: 'keepalive',
                            });
                        }, 30000);
                        webrtc_start(webRtcPeerRef, onIceCandidate, onOffer);
                        break
                    case 'updatePermission':
                        updatePermission(parsedMessage, state.authorization, state.personalPermissions);
                        break;
                    case 'unauthorized':
                        unauthorized(parsedMessage);
                        break;
                    case 'session_id':
                        state.session.value = parsedMessage.session;
                        break;
                    case 'ban':
                        console.log("TODO: BAN");
                        ban(parsedMessage, socketRef, state.roomId, state.banned)
                        break;

                    //Videostream events
                    case 'startResponse':
                        startResponse(parsedMessage, webRtcPeerRef, state.viewPort, state.roomSettings);
                        break;
                    case 'iceCandidate':
                        webRtcPeerRef.current.addIceCandidate(parsedMessage.candidate, function (error) {
                            if (error) {
                                console.error('Error iceCandidate: ' + error);
                                return;
                            } else {
                                console.debug("Successful iceCandidate")
                            }
                        });
                        break;
                    case 'stop_stream':
                        stopVideo();
                        break;
                    case 'start_stream':
                        startVideo();
                        break;

                    //Chat events
                    case 'chat_history':
                        chatHistory(parsedMessage.messages, state.chatMessages);
                        pushTempMessage(`${profile.value.nickname} joined`, state.chatMessages);
                        break;
                    case 'receivemessage':
                        chatMessage(parsedMessage, state.chatMessages, state.newMessageCount, state.session, profile, userSettings, favicon);
                        break;
                    case 'deletemessage':
                        deleteMessage(parsedMessage, state.chatMessages);
                        break;
                    case 'editmessage':
                        editMessage(parsedMessage, state.chatMessages);
                        break;
                    case 'typing':
                        typing(parsedMessage, state.typingUsers);
                        break;

                    //Remote events
                    case 'drop_remote':
                        dropRemote(parsedMessage, state.userlist, state.remoteInfo);
                        break;
                    case 'pickup_remote':
                        pickupRemote(parsedMessage, state.userlist, state.remoteInfo);
                        break;

                    //Userlist events
                    case 'load_users':
                        loadUsers(parsedMessage, state.userlist, state.pingLookup);
                        break;
                    case 'join':
                        join(parsedMessage, state.userlist, state.pingLookup);
                        if(!parsedMessage.anonymous)
                            pushTempMessage(`${parsedMessage.username} joined`, state.chatMessages);
                        break;
                    case 'leave':
                        leave(parsedMessage, state.userlist, state.pingLookup);
                        if(!parsedMessage.anonymous)
                            pushTempMessage(`${parsedMessage.username} left`, state.chatMessages);
                        break;
                    case 'update_user':
                        updateUser(parsedMessage, state.userlist, state.pingLookup);
                        if (parsedMessage.session == profile.value.username) { console.log("TODO: updateProfile") }
                        break;
                    case 'userActivityChange':
                        updateActivity(parsedMessage, state.userlist);
                        break;
                    case 'userMutedChange':
                        updateMuted(parsedMessage, state.userlist);
                    case 'user_list_info':
                        state.userlistAdmin.value = parsedMessage.users ? parsedMessage.users : [];
                        break;

                    //Errors
                    case 'error':
                        console.log('Error from server: ' + parsedMessage.message);
                        break;
                    default:
                        console.log('Unknown action: ', parsedMessage);
                }
            };

            ws.onclose = () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                webrtc_stop(webRtcPeerRef)
                clearInterval(keepAlive.current)
                keepAlive.current = null;
                batch(() => {
                    state.userlist.value = [];
                    state.chatMessages.value = [];
                    state.remoteInfo.value.remote = false;
                    windowTitle.value = "";
                })
                route('/', true);
            }
        });
        return () => {
            console.log("Websocket Cleanup");
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null; // This line is optional
            }
        };
    }, []);

    const sendMessage = useCallback((message) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not open');
            return;
        }
        socketRef.current.send(JSON.stringify(message));
    }, [])

    const onOffer = (error, sdpOffer) => {
        if (error) {
            console.log(error);
            return;
        }

        sendMessage({
            action: 'start',
            sdpOffer: sdpOffer
        });
    }

    const onIceCandidate = (candidate) => {
        sendMessage({
            action: 'onIceCandidate',
            candidate: candidate
        });
    }

    const startVideo = useCallback(() => {
        if (!state.videoPaused.value) stopVideo();
        var videoElement = document.getElementById('video');
        videoElement.play();
        webrtc_start(webRtcPeerRef, onIceCandidate, onOffer);
        state.videoPaused.value = false;
    }, []);

    const stopVideo = useCallback(() => {
        var videoElement = document.getElementById('video');
        videoElement.pause();
        webrtc_stop(webRtcPeerRef);
        state.videoPaused.value = true;
    }, []);

    const toggleVideo = useCallback(() => {
        const paused = state.videoPaused.value
        if (paused) {
            startVideo();
        } else {
            stopVideo();
        }
        if (userSettings.value.showIfMuted) {
            sendMessage({
                action: 'userMuted',
                muted: muted.value || !paused
            });
        }
    }, []);

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            state.newMessageCount.value = 0;
            favicon.current.badge(0);
        }
        calcActiveStatus(document.visibilityState !== 'visible');
    };

    const inactiveTimer = useRef(null);
    const active = useRef(true);
    const calcActiveStatus = (tabbedOut) => {
        let time = 5 * 60 * 1000;
        if (!tabbedOut) {
            clearTimeout(inactiveTimer.current);
            inactiveTimer.current = null;
            if (!active.current) {
                active.current = true;
                sendActivityStatus();
            }
        }
        else {
            if (inactiveTimer.current != null) return;
            inactiveTimer.current = setTimeout(() => {
                active.current = false;
                sendActivityStatus();
            }, time);
        }
    }

    const sendActivityStatus = () => {
        sendMessage({
            action: 'userActivity',
            tabbedOut: !active.current,
        });
    }

    console.log("Provider function is called");

    return (
        <WebSocketContext.Provider value={{ ...state, sendMessage, toggleVideo }}>
            {children}
        </WebSocketContext.Provider>
    );
};