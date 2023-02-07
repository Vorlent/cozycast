package com.github.vorlent.cozycastserver

import javax.inject.Singleton
import java.util.concurrent.ConcurrentHashMap

import com.github.vorlent.cozycastserver.domain.RoomPersistence

@Singleton
class RoomRegistry {
    private final ConcurrentHashMap<String, Room> rooms = new ConcurrentHashMap<>()

    Room getRoom(String name) {
        Room room = rooms.get(name)
        if(!room) {
            RoomPersistence roomPers
            RoomPersistence.withTransaction{
                roomPers = RoomPersistence.get(name);
                if(roomPers == null){
                    roomPers = new RoomPersistence(name: name);
                    roomPers.save(flush: true);
                }
            }
            room = new Room(roomPers)
            rooms.put(name, room)
        }
        return room
    }

    Room getRoomNoCreate(String name) {
        Room room = rooms.get(name)
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
