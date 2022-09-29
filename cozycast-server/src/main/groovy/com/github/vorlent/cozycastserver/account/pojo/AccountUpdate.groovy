package com.github.vorlent.cozycastserver.account

import io.micronaut.core.annotation.Introspected

import javax.validation.constraints.NotBlank
import javax.validation.constraints.Size;
import javax.validation.constraints.Pattern;

@Introspected
class AccountUpdate{

    @NotBlank(message = "Nickname cannot be blank")
    @Size(min = 1, max = 12, message  = "Nickname must be between 1 and 12 characters")
    @Pattern(regexp = "[^ ](?:.?[^ ])*", message = "No leading or trailing spaces and only one space at a time")
    String nickname

    @NotBlank(message = "Name Color cannot be blank")
    @Pattern(regexp = "#(?:[0-9a-fA-F]{3}){1,2}", message = "Color format must be either #FFF or #FFFFFF")
    String nameColor
}