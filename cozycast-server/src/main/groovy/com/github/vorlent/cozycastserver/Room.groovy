package com.github.vorlent.cozycastserver

import java.util.concurrent.ConcurrentHashMap

class Room {
    final ConcurrentHashMap<String, UserSession> users = new ConcurrentHashMap<>()
    WorkerSession worker
    String remote
    String title
}
