package com.github.vorlent.cozycastserver

import javax.inject.Singleton
import java.util.concurrent.ConcurrentHashMap

@Singleton
class RoomRegistry {
    private final ConcurrentHashMap<String, Room> rooms = new ConcurrentHashMap<>()

    Room getRoom(String name) {
        Room room = rooms.get(name)
        if(!room) {
            room = new Room(name: name)
            rooms.put(name, room)
        }
        return room
    }
}
