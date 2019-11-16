import { html, Component, render } from '/js/preact.standalone.module.js'

var globalVar = {};
var state = {
    typingUsers: [],
    userlist: [],
    chatMessages: [],
    chatBox: "",
    remote: false,
    username: "Anonymous",
    volume: 100,
    videoPaused: true,
    videoLoading: false
};

function updateState(fun) {
    fun()
    globalVar.callback(state);
}

class App extends Component {
    chatref = null;
    setChatref = (dom) => this.chatref = dom;

    componentDidMount(){
    	globalVar.callback = (data) => {
        	this.setState(data);
        };
        this.scrollToBottom();
    }

    componentDidUpdate() {
    	this.scrollToBottom();
    }

    scrollToBottom() {
        var messages = document.getElementById("messages");
        messages.scrollTop = messages.scrollHeight;
        document.getElementById('video').volume = state.volume/100;
    }

    render({ page }, { xyz = [] }) {
    return html`
      <div id="pagecontent">
          <div id="videoBig">
              <div id="videocontrols" tabindex="0"
                oncontextmenu=${disableContextmenu}
                onmousemove=${videoMousemove}
                onmouseup=${videoMouseUp}
                onmousedown=${videoMouseDown}
                onpaste=${paste}
                onkeyup=${videoKeyUp}
                onkeydown=${videoKeyDown}
                onwheel=${videoScroll}
              >
                ${state.videoPaused &&
                  html`<div class="paused-screen">
                    <div class="play-button">Play</div>
                </div>`}
                ${state.videoLoading &&
                    html`<div class="paused-screen">
                    <div class="loading-screen">
                        <img class="loading-animation" src="svg/loading.svg"/>
                        LOADING...
                    </div>
                </div>`}
              </div>
              <div id="videosizer">
                <video id="video" autoplay tabindex="0"
                    onplay=${e => videoLoadingScreen(false)}
                    onloadstart=${e => videoLoadingScreen(true)}
                ></video>
              </div>
          </div>
          <div id="pagetoolbar">
              <div id="controls">
                <button type="button" class="btn btn-primary" onclick=${openProfile}>
                  Profile
                </button>
                <button type="button" class="btn ${state.remote ? 'btn-danger' : 'btn-primary'}"
                    onclick=${remote}>
                  Remote
                </button>
                <input type="range" min="0" max="100" value="${state.volume}" class="volumeSlider" oninput=${changeVolume}/>
                <a id="copyright" href="/license" target="_blank">Copyright (C) 2019 Vorlent</a>
              </div>
              <div id="userlist" class="userlist">
                    ${state.userlist.map(user => html`
                        <div class="user">
                            <img class="avatar" src="${user.url}"></img>
                            <div class="centered">${user.username}</div>
                            <i class="icon-keyboard remote" style=${user.remote ? "" : "display: none;"}></i>
                        </div>
                    `)}
              </div>
          </div>
          <div id="chat">
             <div id="messages" ref=${this.setChatref}>
                ${state.chatMessages.map(message => html`
                  <div class="message">
                      <div class="username">${message.username + " " + message.timestamp}</div>
                      ${message.messages.map(msg => html`
                          ${msg.type == "url" &&
                              html`<div><a class="chat-link" target="_blank" href="${msg.href}">${msg.href}</a></div>`}
                          ${msg.type == "image" &&
                              html`<div class="chat-image">
                                  <a class="chat-link" target="_blank" href="${msg.href}"><img src="${msg.href}" /></a>
                              </div>`}
                          ${msg.type == "text" &&
                              html`<div>${msg.message}</div>`}
                      `)}
                  </div>
                `)}
            </div>
            <div id="chatbox">
              <div id="typing">
                ${state.typingUsers.length > 0 && html`
                    ${state.typingUsers.map((user, i) => html`
                        ${user.username}${(state.typingUsers.length - 1 != i) && ', '}
                    `)} ${state.typingUsers.length > 1 ? 'are' : 'is'} typing...
                `}
              </div>
              <textarea id="chatbox-textarea" onkeypress=${chatKeypress}>
                ${state.chatBox}
              </textarea>
            </div>
          </div>

          ${state.profileModal && html`
              <div id="profile-modal-background">
                <div id="profile-modal">
                  <div class="title">
                    <div>
                      Profile
                    </div>
                    <button type="button" id="profile-modal-close" onclick=${closeProfile}>X</button>
                  </div>
                  <div class="image avatar big" style="background-image: url('${state.profileModal.avatarUrl}');">
                    <div class="uploader-overlay" onclick=${openAvatarUpload}>
                      <input id="avatar-uploader" type="file" name="avatar" accept="image/png, image/jpeg" onchange=${avatarSelected}/>
                        <div class="center">Upload</div>
                      </div>
                    </div>
                  <div>
                    Username
                  </div>
                  <input class="profile-modal-username" type="text"
                    onInput=${e => updateProfileUsername(e.target.value)}
                    name="username" value="${state.profileModal.username}"/>
                  <button class="btn btn-primary" onclick=${saveProfile}>Save</a>
                </div>
              </div>`}
      </div>
    `;
    }
}

var preactBody = render(html`<${App} page="All" />`, document.body);

var webRtcPeer;
var websocket;

var lastMouseEvent = Date.now();
var videoElement;
var resolutionX = 1280;
var resolutionY = 720;

updateState(function () {
    state.username = localStorage.getItem("username");
    if(!state.username) {
        state.username = "Anonymous"
    }
    state.avatarUrl = localStorage.getItem("avatarUrl");
    if(!state.avatarUrl) {
        state.avatarUrl = 'https://pepethefrog.ucoz.com/_nw/2/89605944.jpg'
    }
})

function changeVolume(e) {
    updateState(function() {
        state.volume = e.target.value;
    })
}

window.onload = function() {
    connect();
    videoElement = document.getElementById('video');
}

var typingTimer;
function chatKeypress(e) {
    updateState(function() {
        var enterKeycode = 13;
        state.chatBox = e.target.value;
        if(e.which == enterKeycode) {
            e.preventDefault();
            if(state.chatBox.trim() != "") {
                sendMessage({
                    action : 'chatmessage',
                    message: state.chatBox,
                    username: state.username
                });
            }
            e.target.value = ""; // hack
            state.chatBox = "";

            clearTimeout(typingTimer)
            typingTimer = null;
            sendMessage({
                action : 'typing',
                state: 'stop',
                username: state.username
            });
        } else {
            if(typingTimer) {
                clearTimeout(typingTimer)
                typingTimer = null;
            } else {
                sendMessage({
                    action : 'typing',
                    state: 'start',
                    username: state.username
                });
            }

            typingTimer = setTimeout(function() {
                sendMessage({
                    action : 'typing',
                    state: 'stop',
                    username: state.username
                });
                typingTimer = null;
            }, 2000)
        }
    })
}

function disableContextmenu(e) {
    e.preventDefault();
    return false;
}

function videoLoadingScreen(loadingState) {
    updateState(function () {
        state.videoPaused = false;
        state.videoLoading = loadingState;
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

function videoScroll(e) {
    if(!remote) { return }
    if(e.deltaY < 0) {
    	sendMessage({
    		action : 'scroll',
    		direction: "up"
    	});
    }
    if(e.deltaY > 0) {
    	sendMessage({
    		action : 'scroll',
    		direction: "down"
    	});
    }
}

function videoKeyUp(e) {
    if(!remote) { return }
    if(e.ctrlKey && e.key.toLowerCase() == "v") {
    	return;
    }
    e.preventDefault();
    sendMessage({
    	action : 'keyup',
    	key: e.key
    });
}

function videoKeyDown(e) {
    if(!remote) { return }
    if(e.ctrlKey && e.key.toLowerCase() == "v") {
    	return;
    }
    e.preventDefault();
    sendMessage({
    	action : 'keydown',
    	key: e.key
    });
}

function getRemotePosition(e) {
    if(!videoElement) {
        return { x: 0, y: 0 }
    }
    var videoRect = videoElement.getBoundingClientRect();
    var ratioDistortion = (videoRect.width / videoRect.height) / (videoElement.videoWidth / videoElement.videoHeight);
    var wider = (ratioDistortion > 1);
    // assume centered
    var padVt = wider ? 0 : (videoRect.height * (1 - ratioDistortion) / 2);
    var padHz = wider ? (videoRect.width * (1 - 1 / ratioDistortion)) / 2 : 0;
    var correctedRect = { // video rectangle with corrections for black lines
        top: videoRect.top + padVt,
        right: videoRect.right - padHz,
        bottom: videoRect.bottom - padVt,
        left: videoRect.left + padHz
    };
    var x = (e.clientX - correctedRect.left) / (correctedRect.right - correctedRect.left) * resolutionX;
    var y = (e.clientY - correctedRect.top) / (correctedRect.bottom - correctedRect.top) * resolutionY;
    return { x: x, y: y }
}

function videoMouseUp(e) {
    if(!remote) { return }
    var pos = getRemotePosition(e);
    sendMessage({
    	action : 'mouseup',
    	mouseX: pos.x,
    	mouseY: pos.y,
    	button: e.button
    });
}

function videoMouseDown(e) {
    if(!remote) { return }
    var videoElement = document.getElementById('video');
    if(videoElement.paused) {
        videoElement.play();
        videoLoadingScreen(true)
    }

    var pos = getRemotePosition(e);
    sendMessage({
    	action : 'mousedown',
    	mouseX: pos.x,
    	mouseY: pos.y,
    	button: e.button
    });
}

function videoMousemove(e) {
    if(!remote) { return }
    var now = Date.now();
    if(now - lastMouseEvent > 10) {
    	var pos = getRemotePosition(e);
    	sendMessage({
    		action : 'mousemove',
    		mouseX: pos.x,
    		mouseY: pos.y
    	});
    	lastMouseEvent = now;
    }
}

function paste(e) {
    if(!remote) { return }
    e.preventDefault();
    var pastedData = e.clipboardData.getData('text');
    sendMessage({
    	action : 'paste',
    	clipboard: pastedData
    });
}

function typing(parsedMessage) {
    updateState(function () {
        if(parsedMessage.state == "start") {
            state.typingUsers.push({
                username: parsedMessage.username,
                session: parsedMessage.session
            })
        } else if(parsedMessage.state == "stop") {
            state.typingUsers = state.typingUsers.filter(function(user) {
                return user.session != parsedMessage.session;
            });
        }
    })
}

function isImageUrl(url) {
    url = url.toLowerCase()
    return url.endsWith(".png")
    || url.endsWith(".jpg")
    || url.endsWith(".gif")
    || url.endsWith(".bmp")
    || url.endsWith(".webp");
}

function chatmessage(parsedMessage) {
    var urls = linkify.find(parsedMessage.message);
    var split = [];
    var offset = 0;
    var remaining = parsedMessage.message;
    urls.forEach(function(element) {
    	var end = remaining.indexOf(element.value, offset);
    	split.push({ "type": "text", "message": remaining.substring(offset, end) });
    	if(isImageUrl(element.value)) {
    		split.push({ "type": "image", "href": element.value });
    	} else {
    		split.push({ "type": "url", "href": element.value });
    	}
    	offset = end + element.value.length;
    });
    if(offset < remaining.length) {
    	split.push({ "type": "text", "message": remaining.substring(offset, remaining.length) });
    }

    updateState(function () {
        var timestamp = moment(parsedMessage.timestamp).format('h:mm A');
        if(state.chatMessages.length > 0 && state.chatMessages[state.chatMessages.length-1].username == parsedMessage.username) {
            var lastMessage = state.chatMessages[state.chatMessages.length-1];
            split.forEach(function(message) {
                lastMessage.messages.push(message)
            })
        } else {
            state.chatMessages.push({
                username: parsedMessage.username,
                timestamp: moment(parsedMessage.timestamp).format('h:mm A'),
                messages: split
            })
        }
    })
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

function openAvatarUpload() {
    document.getElementById('avatar-uploader').click();
}

function avatarSelected(e) {
    let formData = new FormData();
    formData.append("avatar", e.target.files[0]);
    fetch('/avatar/upload', {method: "POST", body: formData}).then((e) => e.json()).then(function (e) {
        updateState(function () {
            state.profileModal.avatarUrl = e.url;
        })
    });
}

function leave(parsedMessage) {
    updateState(function () {
        state.userlist = state.userlist.filter(function(element) {
            return element.session != parsedMessage.session;
        });
    })
}

window.onbeforeunload = function() {
    websocket.close();
}

function connect() {
    websocket = new WebSocket('ws://' + location.host + '/player/default');
    websocket.onmessage = function(message) {
    	var parsedMessage = JSON.parse(message.data);
        console.log(parsedMessage)
    	switch (parsedMessage.action) {
    		case 'startResponse':
    			startResponse(parsedMessage);
    			break;
    		case 'error':
    			console.log('Error from server: ' + parsedMessage.message);
    			break;
    		case 'typing':
    			typing(parsedMessage);
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
            state.remote = false;
        })
        if (webRtcPeer) {
    		webRtcPeer.dispose();
    		webRtcPeer = null;
    	}
    	connect();
    }

    websocket.onopen = function (event) {
    	setTimeout(function() {
    		start(video);
    	}, 300);
    };
}

function start(video) {
    sendMessage({
    	action : 'join',
    	username: state.username,
        url: state.avatarUrl
    });
    fetch("/turn/credential").then((e) => e.json()).then(function(iceServer) {
    	var options = {
    		remoteVideo : video,
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
}

function openProfile() {
    updateState(function () {
        state.profileModal = {
            username: state.username,
            avatarUrl: state.avatarUrl
        };
    })
}

function closeProfile() {
    updateState(function () {
        delete state.profileModal;
    })
}

function updateProfileUsername(username) {
    updateState(function () {
        state.profileModal.username = username;
    })
}

function saveProfile() {
    updateState(function () {
        if(state.profileModal) {
            localStorage.setItem("username", state.profileModal.username);
            localStorage.setItem("avatarUrl", state.profileModal.avatarUrl);
            state.username = state.profileModal.username;
            state.avatarUrl = state.profileModal.avatarUrl;
            sendMessage({
                action : 'changeusername',
                username : state.username
            });
            sendMessage({
                action : 'changeprofilepicture',
                url : state.avatarUrl
            });
        }
    })
    closeProfile()
}

function sendMessage(message) {
    websocket.send(JSON.stringify(message));
}
