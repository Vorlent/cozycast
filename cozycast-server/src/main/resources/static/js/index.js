var ws = new WebSocket('ws://' + location.host + '/stream');
var webRtcPeer;

var lastMouseEvent = Date.now();
var videoElement;
var resolutionX = 1280;
var resolutionY = 720;

window.onload = function() {
	var video = document.getElementById('video');
	$('#stop').attr('onclick', 'stop()');
	$('#remote').click(remote);
	$('#video').mousemove((e) => videoMousemove(e));
	$('#video').mouseup((e) => videoMouseUp(e));
	$('#video').mousedown((e) => videoMouseDown(e));
	$('#video').keyup((e) => videoKeyUp(e));
	$('#video').keydown((e) => videoKeyDown(e));
	$('#video').on('wheel', (e) => videoScroll(e));
	videoElement = $('#video')[0];
	$('#video')[0].oncontextmenu = function() {return false;}
	setTimeout(function() {
		start(video);
	}, 300);

  $("#chatbox-textarea").keypress(function (e) {
			var enterKeycode = 13;
      if(e.which == enterKeycode) {
				$('#messages').append($(this).val() + "<br/>")
				$(this).val("")
      }
  });
}

function remote() {
	sendMessage({
		action : 'remote'
	});
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

window.onbeforeunload = function() {
	ws.close();
}

ws.onmessage = function(message) {
	var parsedMessage = JSON.parse(message.data);

	switch (parsedMessage.action) {
	case 'startResponse':
		startResponse(parsedMessage);
		break;
	case 'error':
		console.log('Error from server: ' + parsedMessage.message);
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

function start(video) {
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
	ws.send(JSON.stringify(message));
}
