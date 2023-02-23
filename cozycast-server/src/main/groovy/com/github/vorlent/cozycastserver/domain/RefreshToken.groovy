package com.github.vorlent.cozycastserver.domain

import groovy.transform.CompileStatic

import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull
import java.time.Instant

import org.grails.datastore.gorm.GormEntity
import grails.gorm.annotation.Entity
import java.time.ZonedDateTime
import groovy.util.logging.Slf4j

@Slf4j
@Entity
class RefreshToken implements GormEntity<RefreshToken> {

    String id
    String username
    String refreshToken
    ZonedDateTime tokenCreated
    Boolean tokenRevoked

    static mapping = {
        id generator: 'uuid2'
    }
}