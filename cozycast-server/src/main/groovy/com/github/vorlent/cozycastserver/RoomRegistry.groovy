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

    void delete(String name) {
        Room room = rooms.remove(name)
        room?.close()
    }

    Collection<Room> all() {
        return rooms.values()
    }
}
