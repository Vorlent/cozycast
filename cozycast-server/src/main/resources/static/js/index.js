var ws = new WebSocket('ws://' + location.host + '/stream');
var webRtcPeer;

window.onload = function() {
	var video = document.getElementById('video');
	$('#stop').attr('onclick', 'stop()');
	setTimeout(function() {
		start(video);
	}, 300);
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
	var options = {
		remoteVideo : video,
		mediaConstraints : {
			audio : true,
			video : true
		},
		onicecandidate : onIceCandidate
	}

	webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
			function(error) {
				if (error) {
					console.log(error);
					return;
				}
				webRtcPeer.generateOffer(onOffer);
			});
}

function onOffer(error, sdpOffer) {
	if (error) {
		console.log('Error onOffer');
		return;
	}

	sendMessage({
		action : 'start',
		sdpOffer : sdpOffer,
		url : document.getElementById('videourl').value
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
