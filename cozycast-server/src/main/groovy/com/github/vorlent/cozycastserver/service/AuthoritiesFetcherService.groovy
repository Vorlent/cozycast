package com.github.vorlent.cozycastserver.service

import com.github.vorlent.cozycastserver.AuthoritiesFetcher

import jakarta.inject.Singleton
import groovy.transform.CompileStatic

@CompileStatic
@Singleton 
class AuthoritiesFetcherService implements AuthoritiesFetcher {

    private final UserRoleGormService userRoleGormService

    AuthoritiesFetcherService(UserRoleGormService userRoleGormService) { 
        this.userRoleGormService = userRoleGormService
    }

    @Override
    List<String> findAuthoritiesByUsername(String username) {
        userRoleGormService.findAllAuthoritiesByUsername(username)
    }
}