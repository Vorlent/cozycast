package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketSession
import java.time.ZonedDateTime
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

import org.kurento.client.WebRtcEndpoint

class UserEndpoint {
    WebRtcEndpoint webRtcEndpoint
    WebSocketSession webSocketSession
}

class RateLimiter {
    private final long capacity
    private final double tokensPerSecond
    private final AtomicLong tokens
    private long lastRefillTime

    RateLimiter(long capacity, double tokensPerSecond) {
        this.capacity = capacity
        this.tokensPerSecond = tokensPerSecond
        this.tokens = new AtomicLong(capacity)
        this.lastRefillTime = System.nanoTime()
    }

    boolean tryConsume() {
        refill()
        return tokens.getAndUpdate(value -> value > 0 ? (long) (value - 1) : 0) > 0
    }

    private void refill() {
        long now = System.nanoTime()
        long tokensToAdd = (now - lastRefillTime) * tokensPerSecond / Duration.ofSeconds(1).toNanos()
        if (tokensToAdd > 0) {
            tokens.updateAndGet(value -> Math.min(value + tokensToAdd, capacity))
            lastRefillTime = now
        }
    }
}

class UserSession {
    final ConcurrentHashMap<String, UserEndpoint> connections = new ConcurrentHashMap<>()
    String username
    String nickname
    String avatarUrl
    String nameColor
    Boolean active
    Boolean muted
    Boolean anonymous
    Boolean invited
    String tempInviteName
    Boolean admin = false
    Boolean verified = false
    Boolean trusted = false
    Boolean remote_permission = false
    Boolean image_permission = false
    ZonedDateTime lastTimeSeen
    RateLimiter rateLimiter = new RateLimiter(5,(double) 1)

    public void release(String id) {
        connections.computeIfPresent(id, (k,v) -> {v.webRtcEndpoint?.release(); return v});
    }
}
