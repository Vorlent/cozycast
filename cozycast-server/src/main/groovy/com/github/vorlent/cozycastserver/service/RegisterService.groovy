package com.github.vorlent.cozycastserver.service

import com.github.vorlent.cozycastserver.domain.User
import com.github.vorlent.cozycastserver.PasswordEncoder
import grails.gorm.transactions.Transactional
import groovy.transform.CompileStatic

import jakarta.inject.Singleton
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank

@CompileStatic
@Singleton
class RegisterService {

    private final UserGormService userGormService
    private final PasswordEncoder passwordEncoder

    RegisterService( UserGormService userGormService,
                    PasswordEncoder passwordEncoder) {
        this.userGormService = userGormService
        this.passwordEncoder = passwordEncoder
    }

    @Transactional
    boolean register(@Email String email, @NotBlank String username,
                  @NotBlank String rawPassword, boolean admin) {

       User user = userGormService.findByUsername(username)
       if (!user) {
           final String encodedPassword = passwordEncoder.encode(rawPassword)
           user = userGormService.save(email, username, username, encodedPassword, admin)
           return true;
       } else return false;
    }
}