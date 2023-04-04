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
class RoomPersistence implements GormEntity<RoomPersistence> {
    String name
    Boolean accountOnly = false
    Boolean verifiedOnly = false
    Boolean inviteOnly = false
    Boolean centerRemote = false
    Boolean remote_ownership = false
    Boolean default_remote_permission = false
    Boolean default_image_permission = false

    Integer desktopWidth = 1280
    Integer desktopHeight = 720
    Integer scaleWidth = 1280
    Integer scaleHeight = 720
    Integer framerate = 25
    String videoBitrate = "1M"
    String audioBitrate = "96k"

    static mapping = {
        id name: 'name', generator: 'assigned'
    }
}