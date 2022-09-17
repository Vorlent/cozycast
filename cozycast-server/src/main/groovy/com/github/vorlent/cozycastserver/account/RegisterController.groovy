package com.github.vorlent.cozycastserver.account

import com.github.vorlent.cozycastserver.service.RegisterService

import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Post
import io.micronaut.validation.Validated

import javax.validation.Valid

import io.micronaut.security.annotation.Secured

@Secured("isAnonymous()")
@Validated
@Controller("/register")
class RegisterController {

    protected final RegisterService registerService

    RegisterController(RegisterService registerService){
        this.registerService = registerService;
    }

    @Post
    String register(@Body @Valid Account account) {
        registerService.register("email@mail.com",account.username, account.password, ['ROLE_USER']);
        return "ok";
    }
}
