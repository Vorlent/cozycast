package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Delete
import io.micronaut.http.HttpStatus
import io.micronaut.http.HttpResponse


import groovy.transform.CompileStatic

@CompileStatic
@Controller("/api/room")
class RoomController {
    private RoomRegistry roomRegistry

    RoomController(RoomRegistry roomRegistry) {
        this.roomRegistry = roomRegistry
    }

    @Get("/")
    List rooms() {
        roomRegistry.all().collect { it ->
            [
                id: it.name,
                userCount: it.users.size()
            ]
        }
    }

    @Delete("/{name}")
    HttpResponse rooms(String name) {
        roomRegistry.delete(name)
        return HttpResponse.ok()
    }
}
