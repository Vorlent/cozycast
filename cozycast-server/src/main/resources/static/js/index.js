var webRtcPeer;

var lastMouseEvent = Date.now();
var videoElement;
var resolutionX = 1280;
var resolutionY = 720;

var username = sessionStorage.getItem("username");
if(!username) {
	username = window.prompt("Enter your username:","Anonymous");
	sessionStorage.setItem("username", username);
}

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
	$('#video').on('wheel', (e) => videoScroll(e));
	videoElement = $('#video')[0];
	$('#video')[0].oncontextmenu = function() {return false;}

  	$("#chatbox-textarea").keypress(function (e) {
		var enterKeycode = 13;
      	if(e.which == enterKeycode) {
			e.originalEvent.preventDefault();
			if($(this).val().trim() != "") {
				sendMessage({
					action : 'chatmessage',
					message: $(this).val(),
					username: username
				});
			}
			$(this).val("")
      	}
  	});
}

function remote() {
	if($('#remote').hasClass("btn-primary")) {
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
	e.originalEvent.preventDefault();
	sendMessage({
		action : 'keyup',
		key: e.originalEvent.key
	});
}

function videoKeyDown(e) {
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

function chatmessage(parsedMessage) {
	var timestamp = moment(parsedMessage.timestamp).format('h:mm A');
	var message = $("<div class=\"message\"></div>").attr("data-username", parsedMessage.username);
	if($("#messages .message").last().attr("data-username") != parsedMessage.username) {
		message.append($("<div class=\"username\"></div>").text(parsedMessage.username + " " + timestamp))
	} else {
		message = $("#messages .message").last();
	}
	message.append($("<div></div>").text(parsedMessage.message));
	$('#messages').append(message);
	message.linkify({className: "linkified"}).find(".linkified").each(function (i, element) {
		var url = $(element).attr("href");
		if(url && (url.endsWith(".png") || url.endsWith(".jpg"))) {
			$(element).replaceWith($("<img/>").attr("src", url).on("load", function () {
				//scroll on image load
				var messages = document.getElementById("messages");
				messages.scrollTop = messages.scrollHeight;
			}))
		}
	})

	var messages = document.getElementById("messages");
	messages.scrollTop = messages.scrollHeight;
}

function join(parsedMessage) {
	var message = $("<div class=\"user\"></div>").attr("data-id", parsedMessage.session)
		.append($("<img alt=\"Avatar\" src=\"https://pepethefrog.ucoz.com/_nw/2/89605944.jpg\"></img>"))
		.append($("<div class=\"centered\"></div>").text(parsedMessage.username))
		.append($("<i class=\"icon-keyboard remote\"></i>").hide())
		.hide().fadeIn(800);
	$('#userlist').append(message);
}

function leave(parsedMessage) {
	$('#userlist div.user[data-id=\"' + parsedMessage.session + '\"]').fadeOut(800, function() { $(this).remove(); });
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
				$('#userlist div.user[data-id=\"' + parsedMessage.session + '\"] i').hide()
				$('#remote').removeClass("btn-primary");
				$('#remote').addClass("btn-danger");
				break;
			case 'pickup_remote':
				if(parsedMessage.has_remote) {
					$('#remote').removeClass("btn-danger");
					$('#remote').addClass("btn-primary");
				} else {
					$('#remote').removeClass("btn-primary");
					$('#remote').addClass("btn-danger");
				}
				$('#userlist div.user[data-id=\"' + parsedMessage.session + '\"] i').show()
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
		$('#userlist').empty();
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
		username: username
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
