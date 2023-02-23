package com.github.vorlent.cozycastserver.account

import io.micronaut.core.annotation.Introspected

import javax.validation.constraints.NotBlank
import javax.validation.constraints.Size;
import javax.validation.constraints.Pattern;

import java.lang.String

@Introspected
class Account{

    @NotBlank(message = "Username cannot be blank")
    @Size(min = 2, max = 12, message  = "Username must be between 2 and 12 characters")
    @Pattern(regexp = "[a-zA-Z0-9](?:[-_.]?[a-zA-Z0-9])*", message = "Username can only groups of letters or numbers seperated by either -, _ or .")
    String username

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 8, max = 100, message  = "Username must be between 8 and 100 characters")
    String password

    String inviteCode
}