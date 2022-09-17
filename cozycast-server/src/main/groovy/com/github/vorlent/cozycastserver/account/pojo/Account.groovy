package com.github.vorlent.cozycastserver.account

import io.micronaut.core.annotation.Introspected

import javax.validation.constraints.NotBlank

@Introspected
class Account{

    @NotBlank // 
    String username

    @NotBlank // 
    String password
}