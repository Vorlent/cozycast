package com.github.vorlent.cozycastserver.domain

import grails.gorm.annotation.Entity
import org.grails.datastore.gorm.GormEntity
import io.micronaut.core.annotation.Introspected

@Introspected
@Entity 
class UserRole implements GormEntity<UserRole> { 
    String id
    User user
    Role role

    static constraints = {
        user nullable: false
        role nullable: false
    }

    static mapping = {
        id generator: 'uuid2'
    }
}