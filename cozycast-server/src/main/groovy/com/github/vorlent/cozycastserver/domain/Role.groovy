package com.github.vorlent.cozycastserver.domain

import grails.gorm.annotation.Entity
import org.grails.datastore.gorm.GormEntity
import io.micronaut.core.annotation.Introspected

@Introspected
@Entity 
class Role implements GormEntity<Role> {  
    String authority

    static constraints = {
        authority nullable: false, unique: true
    }

    static mapping = {
        id name: 'authority', generator: 'assigned'
    }
}