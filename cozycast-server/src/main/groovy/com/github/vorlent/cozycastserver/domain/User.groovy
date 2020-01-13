package com.github.vorlent.cozycastserver.domain

import grails.gorm.annotation.Entity
import io.micronaut.security.authentication.providers.UserState
import org.grails.datastore.gorm.GormEntity
import java.time.ZonedDateTime
import groovy.util.logging.Slf4j

@Slf4j
@Entity
class User implements GormEntity<User>, UserState {
    String email
    String username
    String password
    boolean enabled = true
    boolean accountExpired = false
    boolean accountLocked = false
    boolean passwordExpired = false
    boolean admin = false

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
