package com.github.vorlent.cozycastserver.account

import io.micronaut.core.annotation.Introspected

import javax.validation.constraints.NotNull
import javax.validation.constraints.Size
import javax.validation.constraints.Pattern

@Introspected
class AccountUpdateAdmin{
    @NotNull(message = "Must declare Admin")
    Boolean admin

    @NotNull(message = "Must declare verified")
    Boolean verified
}