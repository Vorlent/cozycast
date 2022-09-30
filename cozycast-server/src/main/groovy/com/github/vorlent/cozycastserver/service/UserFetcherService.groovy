package com.github.vorlent.cozycastserver.service

import com.github.vorlent.cozycastserver.UserFetcher
import com.github.vorlent.cozycastserver.UserState
import io.micronaut.core.annotation.NonNull
import groovy.transform.CompileStatic

import jakarta.inject.Singleton
import javax.validation.constraints.NotBlank

@CompileStatic
@Singleton 
class UserFetcherService implements UserFetcher {

    private final UserGormService userGormService

    UserFetcherService(UserGormService userGormService) { 
        this.userGormService = userGormService
    }

    @Override
    UserState findByUsername(@NotBlank @NonNull String username) {
        userGormService.findByUsername(username) as UserState
    }
}