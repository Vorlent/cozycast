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
    boolean invited
    boolean banned = false
    boolean remote_permission
    boolean image_permission

    static mapping = {
        id generator: 'uuid2'
    }
}
