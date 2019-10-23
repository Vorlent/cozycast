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
import org.kurento.client.DispatcherOneToMany;
import org.kurento.client.HubPort;
import java.util.TimeZone;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;


@Component
public class StreamHandler extends TextWebSocketHandler {

	@Autowired
  	private KurentoClient kurento;

  	private final Gson gson = new GsonBuilder().create();
  	private final ConcurrentHashMap<String, UserSession> users = new ConcurrentHashMap<>();

	private final ConcurrentHashMap<String, String> data = new ConcurrentHashMap<>();
	private WorkerSession workerSession = new WorkerSession();

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
				case "chatmessage":
					chatmessage(session, jsonMessage);
					break;
				case "join":
					join(session, jsonMessage);
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
				case "paste":
					paste(session, jsonMessage);
					break;
				case "keyup":
					keyup(session, jsonMessage);
					break;
				case "keydown":
					keydown(session, jsonMessage);
					break;
				case "pickup_remote":
					pickupremote(session);
					break;
				case "drop_remote":
					dropremote(session);
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
		final UserSession user = users.get(session.getId());
		MediaPipeline pipeline = workerSession.getMediaPipeline();
		if(pipeline == null) {
			pipeline = kurento.createMediaPipeline();
			workerSession.setMediaPipeline(pipeline);
			System.out.println("ADD createMediaPipeline");
		}
		WebRtcEndpoint webRtcEndpoint = new WebRtcEndpoint.Builder(pipeline).build();
		user.setWebRtcEndpoint(webRtcEndpoint);
		user.setWebSocketSession(session);

		if(workerSession.getRtpEndpoint() == null) {
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
				response.addProperty("videoPort", videoPort);
				response.addProperty("audioPort", audioPort);
				sendMessage(worker, response.toString());
			}
		}

		if(workerSession.getDispatcher() == null) {
			DispatcherOneToMany dispatcher = new DispatcherOneToMany.Builder(pipeline).build();
			HubPort source = new HubPort.Builder(dispatcher).build();
			workerSession.getRtpEndpoint().connect(source);
			dispatcher.setSource(source);
			workerSession.setDispatcher(dispatcher);
		}

		if(workerSession.getDispatcher() != null) {
			HubPort sink = new HubPort.Builder(workerSession.getDispatcher()).build();
			sink.connect(webRtcEndpoint);
		}

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

	private void chatmessage(final WebSocketSession session, JsonObject jsonMessage) {
		System.out.println(jsonMessage);
		TimeZone tz = TimeZone.getTimeZone("UTC");
		DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm'Z'");
		df.setTimeZone(tz);
		String nowAsISO = df.format(new Date());
		JsonObject response = new JsonObject();
		response.addProperty("action", "receivemessage");
		response.add("message", jsonMessage.get("message"));
		response.add("username", jsonMessage.get("username"));
		response.addProperty("timestamp", nowAsISO);
		String responseString = response.toString();
		for(ConcurrentHashMap.Entry<String, UserSession> entry : users.entrySet()) {
    		UserSession value = entry.getValue();
			sendMessage(value.getWebSocketSession(), responseString);
		}
	}

	private void join(final WebSocketSession session, JsonObject jsonMessage) {
		System.out.println(jsonMessage);
		JsonObject response = new JsonObject();
		response.addProperty("action", "join");
		response.addProperty("session", session.getId());
		response.add("username", jsonMessage.get("username"));
		String responseString = response.toString();
		sendMessage(session, responseString);

		final UserSession user = new UserSession();
		user.setUsername(jsonMessage.get("username").getAsString());
		users.put(session.getId(), user);

		for(ConcurrentHashMap.Entry<String, UserSession> entry : users.entrySet()) {
			UserSession value = entry.getValue();
			sendMessage(value.getWebSocketSession(), responseString);

			System.out.println("get username for " + entry.getKey());
			if (value.getUsername() != null) {
				JsonObject existingUserResponse = new JsonObject();
				existingUserResponse.addProperty("action", "join");
				existingUserResponse.addProperty("username", value.getUsername());
				existingUserResponse.addProperty("session", entry.getKey());
				sendMessage(session, existingUserResponse.toString());
			}
		}
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

	private void paste(final WebSocketSession session, JsonObject jsonMessage) {
		if(session.getId().equals(data.get("remote"))) {
			System.out.println(jsonMessage);
			if(worker != null) {
				JsonObject response = new JsonObject();
				response.addProperty("action", "paste");
				response.add("clipboard", jsonMessage.get("clipboard"));
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

	private void pickupremote(final WebSocketSession session) {
		data.put("remote", session.getId());
		for(ConcurrentHashMap.Entry<String, UserSession> entry : users.entrySet()) {
			UserSession value = entry.getValue();
			JsonObject response = new JsonObject();
			response.addProperty("action", "pickup_remote");
			response.addProperty("session", session.getId());
			response.addProperty("has_remote", value.getWebSocketSession().getId().equals(session.getId()));
			sendMessage(value.getWebSocketSession(), response.toString());
		}
	}

	private void dropremote(final WebSocketSession session) {
		data.remove("remote");
		for(ConcurrentHashMap.Entry<String, UserSession> entry : users.entrySet()) {
			UserSession value = entry.getValue();
			JsonObject response = new JsonObject();
			response.addProperty("action", "drop_remote");
			response.addProperty("session", session.getId());
			sendMessage(value.getWebSocketSession(), response.toString());
		}
	}

	private void worker(final WebSocketSession session) {
		System.out.println("WORKER FOUND");
		worker = session;
		if(workerSession != null) {
			workerSession.release();
		}
		workerSession = new WorkerSession();
	}

	private void stop(String sessionId) {
		UserSession user = users.remove(sessionId);
		for(ConcurrentHashMap.Entry<String, UserSession> entry : users.entrySet()) {
			UserSession value = entry.getValue();
			if (value.getUsername() != null) {
				JsonObject existingUserResponse = new JsonObject();
				existingUserResponse.addProperty("action", "leave");
				existingUserResponse.addProperty("username", value.getUsername());
				existingUserResponse.addProperty("session", sessionId);
				sendMessage(value.getWebSocketSession(), existingUserResponse.toString());
			}
		}
		user.release();
	}

	private void sdpAnswer(String sessionId, JsonObject jsonMessage) {
		if (workerSession.getRtpEndpoint() != null) {
			String sdpAnswer = jsonMessage.get("content").getAsString();
			sdpAnswer = sdpAnswer.replace("sprop-stereo:1", "sprop-stereo=1");
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
