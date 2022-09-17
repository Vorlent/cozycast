package com.github.vorlent.cozycastserver.service

import com.github.vorlent.cozycastserver.domain.User
import grails.gorm.services.Service

@Service(User) 
interface UserGormService {

    User save(String email, String username, String password)

    User findByUsername(String username)

    User findById(Serializable id)

    void delete(Serializable id)

    int count()
}