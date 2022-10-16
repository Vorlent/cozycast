package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketBroadcaster
import io.micronaut.websocket.annotation.OnClose
import io.micronaut.websocket.annotation.OnMessage
import io.micronaut.websocket.annotation.OnOpen
import io.micronaut.websocket.annotation.ServerWebSocket
import io.micronaut.websocket.WebSocketSession
import io.micronaut.websocket.CloseReason
import io.micronaut.security.token.jwt.validator.JwtTokenValidator
import io.micronaut.security.authentication.Authentication

import com.github.vorlent.cozycastserver.service.WebsocketRoomService

import groovy.util.logging.Slf4j


@Slf4j
@ServerWebSocket("/player/{room}")
class PlayerWebsocketServer {

    private final WebsocketRoomService websocketRoomService

    PlayerWebsocketServer(WebsocketRoomService websocketRoomService) {
        this.websocketRoomService = websocketRoomService
    }

    @OnMessage
    void onMessage(WebSocketSession session, String room, Map jsonMessage) {
        websocketRoomService.onMessage(session,room, jsonMessage)
    }

    @OnClose
    void onClose(String room, WebSocketSession session) {
        websocketRoomService.onClose(room, session)
    }
}
