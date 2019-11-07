import { html, Component, render } from 'https://unpkg.com/htm/preact/standalone.module.js'

var globalVar = {};
var state = {
    typingUsers: [],
    userlist: [],
    chatMessages: [],
    chatBox: "",
    remote: false,
    username: "Nameless",
    volume: 100
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

  render({ page }, { typingUsers = [], userlist = [] }) {
	return html`
	<body class="background full-height">
	  <div class="container-fluid nogap full-height">
		  <div class="row nogap full-height">
			  <div class="col-md-10 nogap">
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
                      ></div>

					  <video id="video" autoplay class="full-width" tabindex="0"></video>
				  </div>
				  <div class="row">
					  <div class="col-md-3 controls">
                          <div class="row">
                              <div class="col-md-3">
                                  <a id="stop" href="#" class="btn btn-danger" onclick=${stop}>
                                    <span class="glyphicon glyphicon-stop"></span>
                                    Stop
                                  </a>
                              </div>
                              <div class="col-md-3">
        						  <a id="remote" class="btn ${state.remote ? 'btn-primary': 'btn-danger'}"
                                      onclick=${remote}>
        							  Remote
        						  </a>
                              </div>
                              <div class="col-md-3">
                                <input type="range" min="0" max="100" value="${state.volume}" class="volumeSlider" oninput=${changeVolume}/>
                              </div>
                          </div>
						  <div class="row">
							  <div class="col-md-12">
								  <a href="/license" target="_blank">Copyright (C) 2019 Vorlent</a>
							  </div>
						  </div>
					  </div>
					  <div id="userlist" class="col-md-9 userlist">
							${userlist.map(user => html`
								<div class="user">
									<img alt="Avatar" src="https://pepethefrog.ucoz.com/_nw/2/89605944.jpg"></img>
									<div class="centered">${user.username}</div>
									<i class="icon-keyboard remote" style=${user.remote ? "" : "display: none;"}></i>
								</div>
							`)}
					  </div>
				  </div>
			  </div>
			  <div class="col-md-2 chat-color full-height chat">
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
				  <div class="chatbox">
					  <div id="typing">
						  ${typingUsers.map(user => html`
							  <div class="typing">${user.username} is typing...</div>
						  `)}
					  </div>
					  <textarea id="chatbox-textarea" onkeypress=${chatKeypress}>
                        ${state.chatBox}
					  </textarea>
				  </div>
			  </div>
		  </div>
	  </div>
  </body>
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
    state.username = sessionStorage.getItem("username");
    if(!state.username) {
        state.username = window.prompt("Enter your username:","Anonymous");
        sessionStorage.setItem("username", state.username);
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
	var videoRect = videoElement.getBoundingClientRect();
	var x = (e.clientX - videoRect.left) / (videoRect.right - videoRect.left) * resolutionX;
	var y = (e.clientY - videoRect.top) / (videoRect.bottom - videoRect.top) * resolutionY;
	return { x: x, y: y }
}

function videoMouseUp(e) {
	var pos = getRemotePosition(e);
	sendMessage({
		action : 'mouseup',
		mouseX: pos.x,
		mouseY: pos.y,
		button: e.button
	});
}

function videoMouseDown(e) {
    var videoElement = document.getElementById('video');
    if(videoElement.paused) {
        videoElement.play();
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
            state.typingUsers.push({ username: parsedMessage.username })
        } else if(parsedMessage.state == "stop") {
            state.typingUsers = state.typingUsers.filter(function(user) {
                return user.username != parsedMessage.username;
            });
        }
    })
}

function chatmessage(parsedMessage) {
	var urls = linkify.find(parsedMessage.message);
	var split = [];
	var offset = 0;
	var remaining = parsedMessage.message;
	urls.forEach(function(element) {
		var end = remaining.indexOf(element.value, offset);
		split.push({ "type": "text", "message": remaining.substring(offset, end) });
		if(element.value.endsWith(".png") || element.value.endsWith(".jpg") || element.value.endsWith(".gif")) {
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
        state.userlist.push({ username: parsedMessage.username, session: parsedMessage.session, remote: false })
    })
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
	websocket = new WebSocket('ws://' + location.host + '/stream');
	websocket.onmessage = function(message) {
		var parsedMessage = JSON.parse(message.data);

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
        })
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
		username: state.username
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

function stop() {
	if (webRtcPeer) {
		webRtcPeer.dispose();
		webRtcPeer = null;

		sendMessage({
			action : 'stop'
		});
	}
}

function sendMessage(message) {
	websocket.send(JSON.stringify(message));
}
