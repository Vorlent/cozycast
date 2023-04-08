package com.github.vorlent.cozycastserver.domain

import grails.gorm.annotation.Entity
import org.grails.datastore.gorm.GormEntity
import java.time.ZonedDateTime
import java.time.ZoneId
import groovy.util.logging.Slf4j
import com.fasterxml.jackson.annotation.JsonIgnoreProperties

import java.security.SecureRandom
import java.math.BigInteger

@Entity
@JsonIgnoreProperties(['user','id'])
class RoomPermission implements GormEntity<RoomPermission> {
    String id
    User user
    String room
    boolean invited = false
    String inviteName
    boolean trusted = false
    boolean banned = false
    ZonedDateTime bannedUntil
    boolean remote_permission = false
    boolean image_permission = false

    static constraints = {
        inviteName nullable: true
        bannedUntil nullable: true
    }

    static mapping = {
        id generator: 'uuid2'
    }
}
