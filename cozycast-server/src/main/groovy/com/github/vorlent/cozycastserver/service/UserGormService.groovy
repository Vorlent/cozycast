package com.github.vorlent.cozycastserver.service

import com.github.vorlent.cozycastserver.domain.User
import grails.gorm.services.Service

@Service(User) 
interface UserGormService {

    User save(String email, String username, String password)

    User findByUsername(String username)

    User findByRefreshToken(String refreshToken)

    User findById(Serializable id)

    User updateUsername(String id, String refreshToken)

    void delete(Serializable id)

    int count()
}