package com.github.vorlent.cozycastserver.account

import io.micronaut.core.annotation.Introspected

import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull
import javax.validation.constraints.Size
import javax.validation.constraints.Pattern

@Introspected
class PermissionUpdate{
    String inviteName

    @NotNull(message = "Must declare invited")
    Boolean invited

    @NotNull(message = "Must declare banned")
    Boolean banned

    @NotNull(message = "Must declare remote permission")
    Boolean remote_permission

    @NotNull(message = "Must declare image permission")
    Boolean image_permission

    @NotNull(message = "Must declare trusted")
    Boolean trusted

    @NotNull(message = "Must declare room")
    String room

    @NotNull(message = "Must declare user")
    String userId
}