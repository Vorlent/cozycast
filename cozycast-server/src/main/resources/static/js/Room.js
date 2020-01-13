import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { Chat } from '/js/Chat.js'
import { ProfileModal, openProfile } from '/js/ProfileModal.js'
import { Userlist } from '/js/Userlist.js'
import { VideoControls } from '/js/VideoControls.js'
import { state, updateState } from '/js/index.js'

var webRtcPeer;
var websocket;

export class Room extends Component {

    componentDidMount() {
        updateState(function (state) {
            state.username = localStorage.getItem("username");
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
            websocket.close();
        }
    }

    componentWillUnmount() {
        websocket.close();
    }

    componentDidUpdate() {
        document.title = state.windowTitle
    }

    render({ roomId }, { xyz = [] }) {
    return html`
        <div id="pagecontent">
            <${VideoControls} state=${state}/>
            <div id="pagetoolbar">
                <div id="controls">
                    <button type="button" class="btn btn-primary" onclick=${openProfile}>
                        Profile
                    </button>
                    <button type="button" class="btn ${state.remote ? 'btn-danger' : 'btn-primary'}"
                        onclick=${remote}>
                        Remote
                    </button>

                    <button type="button" class="btn ${state.fullscreen ? 'btn-danger' : 'btn-primary'}"
                        onclick=${toggleFullscreen}>
                        Fullscreen
                    </button>

                    <input type="range" min="0" max="100" value="${state.volume}" class="volumeSlider" oninput=${changeVolume}/>
                    <a id="copyright" href="/license" target="_blank">Copyright (C) 2019 Vorlent</a>
                </div>
                <${Userlist} state=${state}/>
            </div>
            <${Chat} state=${state}/>

            <${ProfileModal} state=${state}/>
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

function changeVolume(e) {
    updateState(function(state) {
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
    var queuedMessages = [];
    if(parsedMessage.type == "video") {
        queuedMessages.push({ "type": "video", "href": parsedMessage.image });
    } else if(parsedMessage.type == "image") {
        queuedMessages.push({ "type": "image", "href": parsedMessage.image });
    } else {
        var offset = 0;
        var msg = parsedMessage.message || "";
        var urls = linkify.find(msg);
        var remaining = msg;
        urls.forEach(function(element) {
            if(element.value.indexOf("http") == -1) {
                element.value = "http://" + element.value
            }
        	var end = remaining.indexOf(element.value, offset);
        	queuedMessages.push({ "type": "text", "message": remaining.substring(offset, end) });
            queuedMessages.push({ "type": "url", "href": element.value });
        	offset = end + element.value.length;
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
    if (mention || !state.muteChatNotification && document.hidden && parsedMessage.session !== state.session) {
        var audio = new Audio('/audio/pop.wav');
        audio.play();
    }
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

var keepAlive;

function connect(room) {
    websocket = new WebSocket('ws://' + location.host + '/player/' + room);
    websocket.onmessage = function(message) {
    	var parsedMessage = JSON.parse(message.data);
        console.log(parsedMessage)
    	switch (parsedMessage.action) {
            case 'keepalive':
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
        if (webRtcPeer) {
    		webRtcPeer.dispose();
    		webRtcPeer = null;
    	}
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

function start() {
    sendMessage({
    	action : 'join',
    	username: state.username,
        url: state.avatarUrl
    });
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
        state.videoSettings = message.videoSettings;
    })
}

export function sendMessage(message) {
    websocket.send(JSON.stringify(message));
}