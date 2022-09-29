package com.github.vorlent.cozycastserver.service

import com.github.vorlent.cozycastserver.domain.User
import grails.gorm.services.Service
import java.time.ZonedDateTime

@Service(User) 
interface UserGormService {

    User save(String email, String username, String nickname, String password, boolean admin)

    User findByUsername(String username)

    User findByRefreshToken(String refreshToken)

    User findById(Serializable id)

    User updateRefreshTokenAndTokenCreated(String id, String refreshToken, ZonedDateTime tokenCreated)

    User updateNickname(String id, String nickname)

    void delete(Serializable id)

    int count()
}