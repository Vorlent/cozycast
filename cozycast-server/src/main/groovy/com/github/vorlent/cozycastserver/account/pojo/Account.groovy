package com.github.vorlent.cozycastserver.account

import io.micronaut.core.annotation.Introspected

import javax.validation.constraints.NotBlank
import javax.validation.constraints.Size;
import javax.validation.constraints.Pattern;

@Introspected
class Account{

    @NotBlank(message = "Username cannot be blank")
    @Size(min = 4, max = 12, message  = "Username must be between 4 and 12 characters")
    @Pattern(regexp = "[a-zA-Z0-9](?:[-_]?[a-zA-Z0-9])*", message = "Username can only groups of letters or numbers seperated by either - or _")
    String username

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 8, max = 100, message  = "Username must be between 8 and 100 characters")
    String password
}