import { html, Component, render } from '/js/libs/preact.standalone.module.js'

import { Chat } from '/js/Chat.js'
import { ProfileModal, openProfile } from '/js/ProfileModal.js'
import { Userlist } from '/js/Userlist.js'
import { VideoControls } from '/js/VideoControls.js'

var globalVar = {};
export var state = {
    typingUsers: [],
    userlist: [],
    chatMessages: [],
    newMessage: false,
    chatBox: "",
    remote: false,
    username: "Anonymous",
    volume: 100,
    videoPaused: true,
    videoLoading: false,
    videoSettings: null,
    session: null,
    muteChatNotification: false,
    windowTitle: "CozyCast: Low latency screen capture via WebRTC"
};

export function updateState(fun) {
    fun(state)
    globalVar.callback(state);
}

class App extends Component {
    chatref = null;
    setChatref = (dom) => this.chatref = dom;

    componentDidMount(){
    	globalVar.callback = (data) => {
        	this.setState(data);
        };
    }

    componentDidUpdate() {
        document.title = state.windowTitle
    }

    render({ page }, { xyz = [] }) {
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

                <button type="button" class="btn btn-primary"
                    onclick=${startFullscreen}>
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

var preactBody = render(html`<${App} page="All" />`, document.body);

var webRtcPeer;
var websocket;

updateState(function () {
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
                updateState(function() {
                    state.avatarUrl = '/png/default_avatar.png'
                })
            }
        })
    }
    state.muteChatNotification = localStorage.getItem("muteChatNotification");
})

function startFullscreen() {
    document.getElementById("pagecontent").requestFullscreen()
}

function changeVolume(e) {
    updateState(function() {
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

function chatmessage(parsedMessage) {
    var queuedMessages = [];
    if(parsedMessage.image) {
        queuedMessages.push({ "type": "image", "href": parsedMessage.image });
    } else {
        var offset = 0;
        var urls = linkify.find(parsedMessage.message || "");
        var remaining = parsedMessage.message;
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

    updateState(function () {
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
    if (!state.muteChatNotification && document.hidden && parsedMessage.session !== state.session) {
        document.querySelector("#pop").play();
    }
}

function join(parsedMessage) {
    updateState(function () {
        state.userlist.push({
            username: parsedMessage.username,
            url: parsedMessage.url,
            session: parsedMessage.session,
            remote: false
        })
    })
}

function changeusername(parsedMessage) {
    updateState(function () {
        state.userlist = state.userlist.map(function(element) {
            if(element.session == parsedMessage.session) {
                element.username = parsedMessage.username;
            }
            return element;
        });
    })
}

function changeprofilepicture(parsedMessage) {
    updateState(function () {
        state.userlist = state.userlist.map(function(element) {
            if(element.session == parsedMessage.session) {
                element.url = parsedMessage.url;
            }
            return element;
        });
    })
}

function leave(parsedMessage) {
    updateState(function () {
        state.userlist = state.userlist.filter(function(element) {
            return element.session != parsedMessage.session;
        });
        state.typingUsers = state.typingUsers.filter(function(user) {
            return user.session != parsedMessage.session;
        });
    })
}

window.onload = function() {
    connect();
}

window.onbeforeunload = function() {
    websocket.close();
}

var keepAlive;

function connect() {
    var room = window.location.hash.substr(1) == "" ? 'default' : window.location.hash.substr(1)
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
                parsedMessage.messages
                    .forEach(e => chatmessage(e))
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
                updateState(function () {
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
                updateState(function () {
                    state.userlist = state.userlist.map(function(user) {
                        user.remote = user.session == parsedMessage.session;
                        return user;
                    })
                    state.remote = parsedMessage.has_remote;
                })
    			break;
            case 'window_title':
                updateState(function () {
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
        updateState(function () {
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
    	connect();
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
