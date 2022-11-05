package com.github.vorlent.cozycastserver.service

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.QueryValue
import io.micronaut.core.annotation.Nullable
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Null
import io.micronaut.http.HttpStatus
import io.micronaut.http.HttpResponse
import io.micronaut.security.annotation.Secured
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule
import groovy.util.logging.Slf4j
import java.time.ZonedDateTime
import java.time.ZoneId


import jakarta.inject.Singleton

@Slf4j
@Singleton
class MiscService {

    private String message = "";
    private boolean registerWithInviteOnly = true;

    void updateMessage(message){
        this.message = message;
    }

    void updateRegisterFlag(boolean flag){
        this.registerWithInviteOnly = flag;
    }

    boolean getRegisterWithInviteOnly(){
        return this.registerWithInviteOnly;
    }

    String getMessage(){
        return this.message;
    }

    Object getMiscInfo(){
        return [message: this.message, registerWithInviteOnly: this.registerWithInviteOnly]
    }
}
