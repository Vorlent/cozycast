import { html, Component, render } from 'https://unpkg.com/htm/preact/standalone.module.js'

var globalVar = {};
var state = { typingUsers: [], userlist: [], chatMessages: [], remote: false, username: "Nameless" };

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
	  $("#messages").linkify({className: "linkified"}).find(".linkified").each(function (i, element) {
		  var url = $(element).attr("href");
		  if(url && (url.endsWith(".png") || url.endsWith(".jpg"))) {
			  $(element).replaceWith($("<div class=\"chat-image\"></div>").append($("<img />").attr("src", url).on("load", function () {
				  //scroll on image load
				  var messages = document.getElementById("messages");
				  messages.scrollTop = messages.scrollHeight;
			  })))
		  }
	  })
	  var messages = document.getElementById("messages");
	  messages.scrollTop = messages.scrollHeight;
  }

  render({ page }, { typingUsers = [], userlist = [] }) {
	return html`
	<body class="background full-height">
	  <div class="container-fluid nogap full-height">
		  <div class="row nogap full-height">
			  <div class="col-md-10 nogap">
				  <div id="videoBig">
					  <div id="videocontrols" tabindex="0"></div>
					  <video id="video" autoplay class="full-width" tabindex="0"></video>
				  </div>
				  <div class="row">
					  <div class="col-md-3 controls">
						  <a id="stop" href="#" class="btn btn-danger">
							  <span class="glyphicon glyphicon-stop"></span>
							  Stop
						  </a>
						  <a id="remote" class="btn ${state.remote ? 'btn-primary': 'btn-danger'}">
							  Remote
						  </a>
						  <input id="volume" data-slider-id='volumeSlider' type="text"
							  data-slider-min="0" data-slider-max="100"
							  data-slider-step="1" data-slider-value="100"/>
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
							  	<div>${msg.message}</div>
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
					  <textarea id="chatbox-textarea">
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

console.log(preactBody);

var webRtcPeer;
var websocket;

var lastMouseEvent = Date.now();
var videoElement;
var resolutionX = 1280;
var resolutionY = 720;

state.username = sessionStorage.getItem("username");
if(!state.username) {
	state.username = window.prompt("Enter your username:","Anonymous");
	sessionStorage.setItem("username", state.username);
}
globalVar.callback(state);

window.onload = function() {
	connect();
	$('#volume').slider({
		formatter: function(value) {
			return value + '%';
		}
	}).on('slide', function() {
		var volume = $('#volume').data('slider').getValue();
		$('#video').prop("volume", volume/100);
	});

	var video = document.getElementById('video');
	$('#stop').attr('onclick', 'stop()');
	$('#remote').click(remote);
	$('#videocontrols').mousemove((e) => videoMousemove(e));
	$('#videocontrols').mouseup((e) => videoMouseUp(e));
	$('#videocontrols').mousedown((e) => videoMouseDown(e));
	$("#videocontrols").on("paste", (e) => paste(e));
	$('#videocontrols').keyup((e) => videoKeyUp(e));
	$('#videocontrols').keydown((e) => videoKeyDown(e));
	$('#videocontrols').on('wheel', (e) => videoScroll(e));
	videoElement = $('#video')[0];
	$('#videocontrols')[0].oncontextmenu = function() {return false;}

	var typingTimer;

  	$("#chatbox-textarea").keypress(function (e) {
		var enterKeycode = 13;
      	if(e.which == enterKeycode) {
			e.originalEvent.preventDefault();
			if($(this).val().trim() != "") {
				sendMessage({
					action : 'chatmessage',
					message: $(this).val(),
					username: state.username
				});
			}
			$(this).val("")
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
  	});
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
	if(e.originalEvent.deltaY < 0) {
		sendMessage({
			action : 'scroll',
			direction: "up"
		});
	}
	if(e.originalEvent.deltaY > 0) {
		sendMessage({
			action : 'scroll',
			direction: "down"
		});
	}
}

function videoKeyUp(e) {
	if(e.originalEvent.ctrlKey && e.originalEvent.key.toLowerCase() == "v") {
		return;
	}
	e.originalEvent.preventDefault();
	sendMessage({
		action : 'keyup',
		key: e.originalEvent.key
	});
}

function videoKeyDown(e) {
	if(e.originalEvent.ctrlKey && e.originalEvent.key.toLowerCase() == "v") {
		return;
	}
	e.originalEvent.preventDefault();
	sendMessage({
		action : 'keydown',
		key: e.originalEvent.key
	});
}

function getRemotePosition(e) {
	var videoRect = videoElement.getBoundingClientRect();
	var x = (e.originalEvent.clientX - videoRect.left) / (videoRect.right - videoRect.left) * resolutionX;
	var y = (e.originalEvent.clientY - videoRect.top) / (videoRect.bottom - videoRect.top) * resolutionY;
	return { x: x, y: y }
}

function videoMouseUp(e) {
		var pos = getRemotePosition(e);
		sendMessage({
			action : 'mouseup',
			mouseX: pos.x,
			mouseY: pos.y,
			button: e.originalEvent.button
		});
}

function videoMouseDown(e) {
		var pos = getRemotePosition(e);
		sendMessage({
			action : 'mousedown',
			mouseX: pos.x,
			mouseY: pos.y,
			button: e.originalEvent.button
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
	e.originalEvent.preventDefault();
	var pastedData = e.originalEvent.clipboardData.getData('text');
	sendMessage({
		action : 'paste',
		clipboard: pastedData
	});
}

function typing(parsedMessage) {
	if(parsedMessage.state == "start") {
		state.typingUsers.push({ username: parsedMessage.username })
	} else if(parsedMessage.state == "stop") {
		state.typingUsers = state.typingUsers.filter(function(user) {
			return user.username != parsedMessage.username;
		});
		globalVar.callback(state);
	}
}

function chatmessage(parsedMessage) {
	var timestamp = moment(parsedMessage.timestamp).format('h:mm A');
	if(state.chatMessages.length > 0 && state.chatMessages[state.chatMessages.length-1].username == parsedMessage.username) {
		var lastMessage = state.chatMessages[state.chatMessages.length-1];
		lastMessage.messages.push({ message: parsedMessage.message })
	} else {
		state.chatMessages.push({
			username: parsedMessage.username,
			timestamp: moment(parsedMessage.timestamp).format('h:mm A'),
			messages: [
				{ message: parsedMessage.message }
			]
		})
	}
	globalVar.callback(state);
}

function join(parsedMessage) {
	state.userlist.push({ username: parsedMessage.username, session: parsedMessage.session, remote: false })
	globalVar.callback(state);
}

function leave(parsedMessage) {
	state.userlist = state.userlist.filter(function(element) {
  		return element.session != parsedMessage.session;
	});
	globalVar.callback(state);
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
				state.remote = false;
				state.userlist = state.userlist.map(function(user) {
					if(user.session == parsedMessage.session) {
						user.remote = false;
					}
					return user;
				})
				globalVar.callback(state);
				break;
			case 'pickup_remote':
				state.userlist = state.userlist.map(function(user) {
					user.remote = user.session == parsedMessage.session;
					return user;
				})
				state.remote = parsedMessage.has_remote;
				globalVar.callback(state);
				break;
			case 'iceCandidate':
				webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
					if (error) {
						console.log(parsedMessage);
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
		console.log(event);
		state.userlist = [];
		globalVar.callback(state);
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
	jQuery.get("/turn/credential", function(iceServer) {
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
		console.log('Error onOffer');
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
