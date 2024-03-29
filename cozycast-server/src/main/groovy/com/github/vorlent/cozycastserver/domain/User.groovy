package com.github.vorlent.cozycastserver.domain

import com.github.vorlent.cozycastserver.UserState

import grails.gorm.annotation.Entity
import org.grails.datastore.gorm.GormEntity
import io.micronaut.core.annotation.Introspected
import java.time.ZonedDateTime
import groovy.util.logging.Slf4j
import com.fasterxml.jackson.annotation.JsonIgnoreProperties

import java.time.ZonedDateTime
import java.time.ZoneId

@Slf4j
@Introspected
@Entity
@JsonIgnoreProperties(['password','refreshToken'])
class User implements GormEntity<User>, UserState{
    String email
    String username
    String nickname
    String password
    boolean verified = false

    String avatarUrl = "/png/default_avatar.png"
    String nameColor = "#fff"
    boolean enabled = true
    boolean accountExpired = false
    boolean accountLocked = false
    boolean passwordExpired = false
    boolean admin = false

    def beforeDelete() {
        if(admin) return false;
        RoomPermission.withTransaction{
            RoomPermission.where{
                user == this
            }.deleteAll()
        }
        RefreshToken.withTransaction{
            RefreshToken.where{
                username == this.username
            }.deleteAll()
        }
        return true;
    }

    static constraints = {
        email nullable: true, blank: false
        username nullable: false, blank: false, unique: true
        password nullable: false, blank: false, password: true
    }

    static mapping = {
        table 'users'
        id name: 'username', generator: 'assigned'
        password column: '`password`'
        }
}
