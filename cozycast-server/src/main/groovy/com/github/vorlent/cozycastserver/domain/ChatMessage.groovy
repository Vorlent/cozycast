package com.github.vorlent.cozycastserver.domain

import grails.gorm.annotation.Entity
import java.time.ZonedDateTime

@Entity
class ChatMessage {
    String id
    String room
    String username
    String message
    ZonedDateTime timestamp

    static mapping = {
        id generator: 'uuid'
    }

    static constraints = {
        message maxSize: 4096
    }
}
