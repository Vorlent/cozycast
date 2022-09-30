package com.github.vorlent.cozycastserver.account

import com.github.vorlent.cozycastserver.service.RegisterService
import com.github.vorlent.cozycastserver.service.MessageSource

import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Post
import io.micronaut.validation.Validated

import javax.validation.Valid

import io.micronaut.security.annotation.Secured


import groovy.util.logging.Slf4j

import javax.validation.ConstraintViolationException
import io.micronaut.http.annotation.Error

@Slf4j
@Secured("isAnonymous()")
@Validated
@Controller("/register")
class RegisterController {

    protected final RegisterService registerService
    private final MessageSource messageSource

    RegisterController(RegisterService registerService, MessageSource messageSource){
        this.registerService = registerService;
        this.messageSource = messageSource;
    }

    @Post
    HttpResponse<?> register(@Body @Valid Account account) {
        boolean registerd = registerService.register(null,account.username, account.password, false);
        if(registerd) return HttpResponse.ok();
        else { 
            return HttpResponse.badRequest().body([errors: ["Username already taken"]]);
            }
    }

    @Error(exception = ConstraintViolationException) 
    HttpResponse<?> onInvalidJson(ConstraintViolationException ex) { // 
        HttpResponse.badRequest().body([errors: messageSource.violationsMessages(ex.constraintViolations) ])
    }
}

