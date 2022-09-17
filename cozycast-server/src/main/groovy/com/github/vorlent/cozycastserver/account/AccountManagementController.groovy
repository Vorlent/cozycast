package com.github.vorlent.cozycastserver.account

import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get

import io.micronaut.security.annotation.Secured

import groovy.util.logging.Slf4j
import com.github.vorlent.cozycastserver.domain.User

@Slf4j
@Secured(["ROLE_USER"])
@Controller("/account")
class AccountManagementController {
    @Get
    ArrayList accounts() {
        ArrayList user = null
        User.withTransaction {
            user = User.list()
        }
        return user;
    }
}