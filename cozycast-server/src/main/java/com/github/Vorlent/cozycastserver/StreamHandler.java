package com.github.vorlent.cozycastserver;

import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.Map;
import java.util.List;
import com.google.gson.Gson;
import java.util.concurrent.CopyOnWriteArrayList;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

import org.kurento.client.EndOfStreamEvent;
import org.kurento.client.ErrorEvent;
import org.kurento.client.EventListener;
import org.kurento.client.IceCandidate;
import org.kurento.client.IceCandidateFoundEvent;
import org.kurento.client.KurentoClient;
import org.kurento.client.MediaPipeline;
import org.kurento.client.MediaState;
import org.kurento.client.MediaStateChangedEvent;
import org.kurento.client.RtpEndpoint;
import org.kurento.client.VideoInfo;
import org.kurento.client.WebRtcEndpoint;
import org.kurento.commons.exception.KurentoException;
import org.kurento.jsonrpc.JsonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

@Component
public class StreamHandler extends TextWebSocketHandler {

	@Autowired
  	private KurentoClient kurento;

  	private final Gson gson = new GsonBuilder().create();
  	private final ConcurrentHashMap<String, UserSession> users = new ConcurrentHashMap<>();

	private final ConcurrentHashMap<String, String> data = new ConcurrentHashMap<>();
	private final WorkerSession workerSession = new WorkerSession();

	public WebSocketSession worker;

  	@Override
  	public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    	JsonObject jsonMessage = gson.fromJson(message.getPayload(), JsonObject.class);
    	String sessionId = session.getId();

    	try {
	      	switch (jsonMessage.get("action").getAsString()) {
	        	case "start":
	          		start(session, jsonMessage);
	          		break;
	        	case "stop":
	          		stop(sessionId);
	          		break;
				case "scroll":
					scroll(session, jsonMessage);
					break;
				case "mousemove":
					mousemove(session, jsonMessage);
					break;
				case "mouseup":
					mouseup(session, jsonMessage);
					break;
				case "mousedown":
					mousedown(session, jsonMessage);
					break;
				case "keyup":
					keyup(session, jsonMessage);
					break;
				case "keydown":
					keydown(session, jsonMessage);
					break;
				case "remote":
					remote(session);
					break;
				case "worker":
					worker(session);
					break;
				case "sdpAnswer":
					sdpAnswer(sessionId, jsonMessage);
					break;
	        	case "onIceCandidate":
	          		onIceCandidate(sessionId, jsonMessage);
	          		break;
	        	default:
	          		sendError(session, "Invalid message with action " + jsonMessage.get("action").getAsString());
	          		break;
	  		}
    	} catch (Throwable t) {
			t.printStackTrace();
      		sendError(session, t.getMessage());
    	}
  	}

	private void start(final WebSocketSession session, JsonObject jsonMessage) {
		final UserSession user = new UserSession();
		MediaPipeline pipeline = kurento.createMediaPipeline();
		user.setMediaPipeline(pipeline);
		WebRtcEndpoint webRtcEndpoint = new WebRtcEndpoint.Builder(pipeline).build();
		user.setWebRtcEndpoint(webRtcEndpoint);
		String videourl = jsonMessage.get("url").getAsString();
		users.put(session.getId(), user);

		RtpEndpoint rtpEndpoint = new RtpEndpoint.Builder(pipeline).build();
		workerSession.setRtpEndpoint(rtpEndpoint);
		String workerSDPOffer = rtpEndpoint.generateOffer();

		String videoPort = null;
		Matcher videoMatcher = Pattern.compile("m=video (\\d+)").matcher(workerSDPOffer);
		if(videoMatcher.find()) {
			videoPort = videoMatcher.group(1);
		}

		String audioPort = null;
		Matcher audioMatcher = Pattern.compile("m=audio (\\d+)").matcher(workerSDPOffer);
		if(audioMatcher.find()) {
			audioPort = audioMatcher.group(1);
		}
		System.out.println(workerSDPOffer);

		if(worker != null) {
			JsonObject response = new JsonObject();
			response.addProperty("type", "sdpOffer");
			response.addProperty("ip", "127.0.0.1");
			System.out.println("videoPort : " + videoPort);
			response.addProperty("videoPort", videoPort);
			System.out.println("audioPort : " + audioPort);
			response.addProperty("audioPort", audioPort);
			sendMessage(worker, response.toString());
		}

		rtpEndpoint.connect(webRtcEndpoint);

		webRtcEndpoint.addIceCandidateFoundListener(new EventListener<IceCandidateFoundEvent>() {
			@Override
			public void onEvent(IceCandidateFoundEvent event) {
				JsonObject response = new JsonObject();
				response.addProperty("action", "iceCandidate");
				response.add("candidate", JsonUtils.toJsonObject(event.getCandidate()));
				try {
					synchronized (session) {
						session.sendMessage(new TextMessage(response.toString()));
					}
				} catch (IOException e) {
					System.out.println(e.getMessage());
				}
			}
		});

		String sdpOffer = jsonMessage.get("sdpOffer").getAsString();
		String sdpAnswer = webRtcEndpoint.processOffer(sdpOffer);

		JsonObject response = new JsonObject();
		response.addProperty("action", "startResponse");
		response.addProperty("sdpAnswer", sdpAnswer);
		sendMessage(session, response.toString());

		webRtcEndpoint.gatherCandidates();
	}

	private void scroll(final WebSocketSession session, JsonObject jsonMessage) {
		if(session.getId().equals(data.get("remote"))) {
			System.out.println(jsonMessage);
			if(worker != null) {
				JsonObject response = new JsonObject();
				response.addProperty("action", "scroll");
				response.add("direction", jsonMessage.get("direction"));
				sendMessage(worker, response.toString());
			}
		}
	}

	private void keyup(final WebSocketSession session, JsonObject jsonMessage) {
		if(session.getId().equals(data.get("remote"))) {
			System.out.println(jsonMessage);
			if(worker != null) {
				JsonObject response = new JsonObject();
				response.addProperty("action", "keyup");
				response.add("key", jsonMessage.get("key"));
				sendMessage(worker, response.toString());
			}
		}
	}

	private void keydown(final WebSocketSession session, JsonObject jsonMessage) {
		if(session.getId().equals(data.get("remote"))) {
			if(worker != null) {
				JsonObject response = new JsonObject();
				response.addProperty("action", "keydown");
				response.add("key", jsonMessage.get("key"));
				sendMessage(worker, response.toString());
			}
		}
	}

	private void mousemove(final WebSocketSession session, JsonObject jsonMessage) {
		if(session.getId().equals(data.get("remote"))) {
			if(worker != null) {
				JsonObject response = new JsonObject();
				response.addProperty("action", "mousemove");
				response.add("mouseX", jsonMessage.get("mouseX"));
				response.add("mouseY", jsonMessage.get("mouseY"));
				sendMessage(worker, response.toString());
			}
		}
	}

	private void mouseup(final WebSocketSession session, JsonObject jsonMessage) {
		if(session.getId().equals(data.get("remote"))) {
			if(worker != null) {
				JsonObject response = new JsonObject();
				response.addProperty("action", "mouseup");
				response.add("mouseX", jsonMessage.get("mouseX"));
				response.add("mouseY", jsonMessage.get("mouseY"));
				response.add("button", jsonMessage.get("button"));
				sendMessage(worker, response.toString());
			}
		}
	}

	private void mousedown(final WebSocketSession session, JsonObject jsonMessage) {
		if(session.getId().equals(data.get("remote"))) {
			if(worker != null) {
				JsonObject response = new JsonObject();
				response.addProperty("action", "mousedown");
				response.add("mouseX", jsonMessage.get("mouseX"));
				response.add("mouseY", jsonMessage.get("mouseY"));
				response.add("button", jsonMessage.get("button"));
				sendMessage(worker, response.toString());
			}
		}
	}

	private void remote(final WebSocketSession session) {
		data.put("remote", session.getId());
	}

	private void worker(final WebSocketSession session) {
		System.out.println("WORKER FOUND");
		worker = session;
	}

	private void stop(String sessionId) {
		UserSession user = users.remove(sessionId);

		if (user != null) {
			user.release();
		}
	}

	private void sdpAnswer(String sessionId, JsonObject jsonMessage) {
		if (workerSession.getRtpEndpoint() != null) {
			String sdpAnswer = jsonMessage.get("content").getAsString();
			System.out.println(sdpAnswer);
			workerSession.getRtpEndpoint().processAnswer(sdpAnswer);
		}
	}

	private void onIceCandidate(String sessionId, JsonObject jsonMessage) {
		UserSession user = users.get(sessionId);

		if (user != null) {
			JsonObject jsonCandidate = jsonMessage.get("candidate").getAsJsonObject();
			System.out.println(jsonCandidate);
			IceCandidate candidate = new IceCandidate(
				jsonCandidate.get("candidate").getAsString(),
				jsonCandidate.get("sdpMid").getAsString(),
				jsonCandidate.get("sdpMLineIndex").getAsInt());
			user.getWebRtcEndpoint().addIceCandidate(candidate);
		}
	}

	public void sendPlayEnd(WebSocketSession session) {
		if (users.containsKey(session.getId())) {
			JsonObject response = new JsonObject();
			response.addProperty("action", "playEnd");
			sendMessage(session, response.toString());
		}
	}

	private void sendError(WebSocketSession session, String message) {
		if (users.containsKey(session.getId())) {
			JsonObject response = new JsonObject();
			response.addProperty("action", "error");
			response.addProperty("message", message);
			sendMessage(session, response.toString());
		}
	}

	private synchronized void sendMessage(WebSocketSession session, String message) {
		try {
			session.sendMessage(new TextMessage(message));
		} catch (IOException e) {
			System.out.println("Exception sending message " + e.getMessage());
		}
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		stop(session.getId());
	}
}
