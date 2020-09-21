import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { Chat } from '/js/Chat.js'
import { RoomSidebar } from '/js/RoomSidebar.js'
import { ProfileModal, openProfile } from '/js/ProfileModal.js'
import { Userlist } from '/js/Userlist.js'
import { VideoControls } from '/js/VideoControls.js'
import { Button } from '/js/Button.js'
import { SidebarState, state, updateState } from '/js/index.js'

var favicon = new Favico({
    animation:'none'
});

var webRtcPeer;
var websocket;

export class Room extends Component {

    componentDidMount() {
        document.onvisibilitychange = function functionName() {
            updateState(function (state) {
                if(!document.hidden) {
                    state.newMessageCount = 0
                    favicon.badge(state.newMessageCount);
                }
            })
        }

        var roomId = this.props.roomId
        updateState(function (state) {
            state.roomToken = localStorage.getItem("room-" + roomId + "-token");
            state.username = localStorage.getItem("username");
            state.banned = localStorage.getItem("banned");
            if(!state.username) {
                state.username = "Anonymous"
            }
            state.avatarUrl = localStorage.getItem("avatarUrl");
            if(!state.avatarUrl) {
                state.avatarUrl = '/png/default_avatar.png'
            } else {
                fetch(state.avatarUrl).then((e) => {
                    if(e.status != 200) {
                        updateState(function(state) {
                            state.avatarUrl = '/png/default_avatar.png'
                        })
                    }
                })
            }
            state.muteChatNotification = localStorage.getItem("muteChatNotification");
        })
        connect(this.props.roomId)
        window.onbeforeunload = function() {
            if(websocket) {
                websocket.close();
            }
        }
    }

    componentWillUnmount() {
        websocket.close();
    }

    componentDidUpdate() {
        document.title = state.windowTitle
    }

    toggleRoomSettings() {
        updateState(function (state) {
            if(state.roomSidebar != SidebarState.SETTINGS) {
                state.roomSidebar = SidebarState.SETTINGS
            } else {
                state.roomSidebar = SidebarState.CHAT
            }
        })
    }

    render({ roomId }, { xyz = [] }) {
    return html`
        <div id="pagecontent">

            ${isBanned() && html`Banned until ${state.banned}`}
            ${!isBanned() && html`
            <${VideoControls} state=${state}/>
            <div id="pagetoolbar">
                <div id="controls">
                    <${Button} enabled=${state.profileModal} onclick=${openProfile}>Profile<//>
                    <${Button} enabled=${state.remote} onclick=${remote}>Remote<//>
                    <${Button} enabled=${state.videoPaused}
                        title="${state.videoPaused ? 'Pause' : 'Play'}" onclick=${pauseVideo}>
                        <img class="video-control-icon" src="${state.videoPaused ? '/svg/play_button.svg' : '/svg/pause_button.svg'}"/>
                    <//>
                    <${Button} enabled=${state.fullscreen}
                        title="Fullscreen" onclick=${toggleFullscreen}>
                        <img class="video-control-icon" src="/svg/fullscreen_button.svg"/>
                    <//>
                    <input type="range" min="0" max="100" value="${state.volume}" class="volumeSlider" oninput=${changeVolume}/>
                    <a id="copyright" href="/license" target="_blank">Copyright (C) 2019 Vorlent</a>
                    ${state.roomToken
                    && html`<${Button} enabled=${state.roomSidebar == SidebarState.SETTINGS}
                            onclick=${e => this.toggleRoomSettings(roomId)}>
                            <img class="room-settings-icon" src="/png/settings.png"/>
                        <//>`}
                </div>
                <${Userlist} state=${state}/>
            </div>
            <${RoomSidebar} state=${state}/>

            <${ProfileModal} state=${state}/>
            `}
        </div>
    `;
    }
}


document.addEventListener('fullscreenchange', (event) => {
  updateState(function(state) {
      state.fullscreen = document.fullscreenElement !== null
  })
});

function toggleFullscreen() {
    if(document.fullscreenElement != null) {
        document.exitFullscreen()
    } else {
        document.getElementById("pagecontent").requestFullscreen()
    }
}

export function pauseVideo(e) {
    updateState(function(state) {
        state.videoPaused = !state.videoPaused;
        if(state.videoPaused) {
            var videoElement = document.getElementById('video');
            videoElement.pause();
            webrtc_stop()
        } else {
            var videoElement = document.getElementById('video');
            videoElement.play();
            webrtc_start()
        }
    })
}

function changeVolume(e) {
    updateState(function(state) {
        console.log(e.target.value)
        state.volume = e.target.value;
    })
}

function remote() {
    if(state.remote) {
    	sendMessage({
    		action : 'drop_remote'
    	});
    } else {
    	sendMessage({
    		action : 'pickup_remote'
    	});
    }
}

function typing(parsedMessage) {
    updateState(function (state) {
        if(parsedMessage.state == "start") {
            var typingUser = state.typingUsers.find(e => e.session == parsedMessage.session)
            if(typingUser) {
                typingUser.lastTypingTime = moment()
            } else {
                state.typingUsers.push({
                    username: parsedMessage.username,
                    session: parsedMessage.session,
                    lastTypingTime: moment()
                })
            }
        } else if(parsedMessage.state == "stop") {
            state.typingUsers = state.typingUsers.filter(function(user) {
                return user.session != parsedMessage.session;
            });
        }
    })
}

function chatmessage(parsedMessage, skip_notifications) {
    var msg = parsedMessage.message || "";
    var queuedMessages = [];
    if(parsedMessage.type == "video") {
        queuedMessages.push({ "type": "video", "href": parsedMessage.image });
    } else if(parsedMessage.type == "image") {
        queuedMessages.push({ "type": "image", "href": parsedMessage.image });
    } else {
        var offset = 0;
        var urls = linkify.find(msg);
        var remaining = msg;
        urls.forEach(function(element) {
            var end = remaining.indexOf(element.value, offset);
            queuedMessages.push({ "type": "text", "message": remaining.substring(offset, end) });
            offset = end + element.value.length;
            if(element.value.indexOf("http") == -1) {
                element.value = "http://" + element.value
            }
            queuedMessages.push({ "type": "url", "href": element.value });
        });
        if(offset < remaining.length) {
        	queuedMessages.push({ "type": "text", "message": remaining.substring(offset, remaining.length) });
        }
    }

    updateState(function (state) {
        var timestamp = moment(parsedMessage.timestamp).format('h:mm A');
        if(state.chatMessages.length > 0 && state.chatMessages[state.chatMessages.length-1].username == parsedMessage.username) {
            var lastMessage = state.chatMessages[state.chatMessages.length-1];
            queuedMessages.forEach(function(message) {
                lastMessage.messages.push(message)
            })
        } else {
            state.chatMessages.push({
                username: parsedMessage.username,
                timestamp: moment(parsedMessage.timestamp).format('h:mm A'),
                messages: queuedMessages
            })
        }
        state.newMessage = true
    })
    if(skip_notifications) {
        return
    }
    var lowerCaseMsg = msg.toLowerCase()
    var pattern = "@" + state.username.toLowerCase()
    var mentionPos = lowerCaseMsg.indexOf(pattern)
    var lookahead = lowerCaseMsg.substring(mentionPos, (pattern + " ").length).trim()
    var mention = lookahead == pattern
    if (state.historyMode || mention || !state.muteChatNotification && document.hidden && parsedMessage.session !== state.session) {
        var audio = new Audio('/audio/pop.wav');
        audio.play();
    }
    updateState(function (state) {
        if(document.hidden) {
            state.newMessageCount++;
            favicon.badge(state.newMessageCount);
        }
    })
}

function join(parsedMessage) {
    leave(parsedMessage)
    updateState(function (state) {
        state.userlist.push({
            username: parsedMessage.username,
            url: parsedMessage.url,
            session: parsedMessage.session,
            remote: false
        })
    })
}

function changeusername(parsedMessage) {
    updateState(function (state) {
        state.userlist = state.userlist.map(function(element) {
            if(element.session == parsedMessage.session) {
                element.username = parsedMessage.username;
            }
            return element;
        });
    })
}

function changeprofilepicture(parsedMessage) {
    updateState(function (state) {
        state.userlist = state.userlist.map(function(element) {
            if(element.session == parsedMessage.session) {
                element.url = parsedMessage.url;
            }
            return element;
        });
    })
}

function leave(parsedMessage) {
    updateState(function (state) {
        state.userlist = state.userlist.filter(function(element) {
            return element.session != parsedMessage.session;
        });
        state.typingUsers = state.typingUsers.filter(function(user) {
            return user.session != parsedMessage.session;
        });
    })
}

function ban(parsedMessage) {
    if(parsedMessage.session == state.session) {
        updateState(function (state) {
            localStorage.setItem("banned", parsedMessage.expiration);
            state.banned = parsedMessage.expiration
            websocket.close();
        })
    }
}

function isBanned() {
    if(state.banned == null) {
        return false;
    }
    if(state.banned == "unlimited") {
        return true
    } else {
        var expiration = new Date(state.banned)
        console.log(new Date().getTime())
        console.log(expiration.getTime())
        if(new Date().getTime() < expiration.getTime()) {
            return true
        }
    }
    return false
}

var keepAlive;

function connect(room) {
    if(isBanned()) {
        return;
    }
    updateState(function (state) {
        state.roomId = room;
    })
    var wsProtocol = 'wss'
    if(document.location.protocol != 'https:') {
        wsProtocol = 'ws'
    }
    websocket = new WebSocket(wsProtocol + '://' + location.host + '/player/' + room);
    websocket.onmessage = function(message) {
    	var parsedMessage = JSON.parse(message.data);
        console.log(parsedMessage)
    	switch (parsedMessage.action) {
            case 'keepalive':
    			break;
            case 'ban':
                ban(parsedMessage)
    			break;
            case 'session_id':
                updateState(function (state) {
                    state.session = parsedMessage.session;
                })
                break;
    		case 'startResponse':
    			startResponse(parsedMessage);
    			break;
    		case 'error':
    			console.log('Error from server: ' + parsedMessage.message);
    			break;
    		case 'typing':
    			typing(parsedMessage);
    			break;
            case 'chat_history':
                if(parsedMessage.messages) {
                    parsedMessage.messages
                        .forEach(e => chatmessage(e, true))
                    updateState(function (state) {
                        state.forceChatScroll = true
                    })
                }
                break;
    		case 'receivemessage':
    			chatmessage(parsedMessage);
    			break;
            case 'changeusername':
                changeusername(parsedMessage);
                break;
            case 'changeprofilepicture':
                changeprofilepicture(parsedMessage);
                break;
    		case 'join':
    			join(parsedMessage);
    			break;
    		case 'leave':
    			leave(parsedMessage);
    			break;
    		case 'drop_remote':
                updateState(function (state) {
                    state.remote = false;
                    state.userlist = state.userlist.map(function(user) {
                        if(user.session == parsedMessage.session) {
                            user.remote = false;
                        }
                        return user;
                    })
                })
    			break;
    		case 'pickup_remote':
                updateState(function (state) {
                    state.userlist = state.userlist.map(function(user) {
                        user.remote = user.session == parsedMessage.session;
                        return user;
                    })
                    state.remote = parsedMessage.has_remote;
                })
    			break;
            case 'window_title':
                updateState(function (state) {
                    state.windowTitle = parsedMessage.title
                })
                break;
    		case 'iceCandidate':
    			webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
    				if (error) {
    					console.log('Error iceCandidate: ' + error);
    					return;
    				}
    			});
    			break;
    		default:
    			console.log('Unknown action: ', parsedMessage);
    	}
    }
    websocket.onclose = function (event) {
        updateState(function (state) {
            state.userlist = [];
            state.typingUsers = [];
            state.chatMessages = [];
            state.remote = false;
        })
        webrtc_stop()
        clearInterval(keepAlive)
        keepAlive = null;
    	connect(room);
    }

    websocket.onopen = function (event) {
    	setTimeout(function() {
    		start();
    	}, 300);
    };

     keepAlive = setInterval(function(){
         sendMessage({
         	action : 'keepalive'
         });
     }, 30000);
}

export function sendRoomSettings(settings) {
    sendMessage({
    	action : 'room_settings_save',
        token: state.roomToken,
        accessType: settings.accessType,
        centerRemote: settings.centerRemote,
        desktopResolution: settings.desktopResolution,
        streamResolution: settings.streamResolution,
        framerate: settings.framerate,
        videoBitrate: settings.videoBitrate,
        audioBitrate: settings.audioBitrate
    });
}

export function sendWorkerRestart() {
    sendMessage({
    	action : 'worker_restart',
        token: state.roomToken
    });
}

function start() {
    sendMessage({
    	action : 'join',
    	username: state.username,
        url: state.avatarUrl,
        token: state.roomToken
    });
    webrtc_start()
}

function webrtc_start() {
    fetch("/turn/credential").then((e) => e.json()).then(function(iceServer) {
    	var options = {
    		remoteVideo : document.getElementById("video"),
    		mediaConstraints : {
    			audio : true,
    			video : true
    		},
    		onicecandidate : onIceCandidate,
    		configuration: {
    			iceServers: [iceServer]
    		}
    	}

    	webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
    		function(error) {
    			if (error) {
    				console.log(error);
    				return;
    			}
    			webRtcPeer.generateOffer(onOffer);
    		});
    });
}

function webrtc_stop() {
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;
    }
}

function onOffer(error, sdpOffer) {
    if (error) {
    	console.log(error);
    	return;
    }

    sendMessage({
    	action : 'start',
    	sdpOffer : sdpOffer
    });
}

function onIceCandidate(candidate) {
    sendMessage({
    	action : 'onIceCandidate',
    	candidate : candidate
    });
}

function startResponse(message) {
    webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
    	if (error) {
    		console.log(error);
    		return;
    	}
    });
    updateState(function (state) {
        var settings = message.videoSettings
        state.viewPort.width = settings.desktopWidth
        state.viewPort.height = settings.desktopHeight
        state.roomSettings.desktopResolution = settings.desktopHeight
        state.roomSettings.streamResolution = settings.scaleHeight
        state.roomSettings.framerate = settings.framerate
        state.roomSettings.videoBitrate = settings.videoBitrate
        state.roomSettings.audioBitrate = settings.audioBitrate
    })
}

export function sendMessage(message) {
    websocket.send(JSON.stringify(message));
}
