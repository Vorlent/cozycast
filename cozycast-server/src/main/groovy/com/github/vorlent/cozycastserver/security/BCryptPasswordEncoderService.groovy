package com.github.vorlent.cozycastserver

import groovy.transform.CompileStatic
import io.micronaut.core.annotation.NonNull
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder as SpringSecurityPasswordEncoder
import jakarta.inject.Singleton
import javax.validation.constraints.NotBlank

@CompileStatic
@Singleton 
class BCryptPasswordEncoderService implements PasswordEncoder {

    SpringSecurityPasswordEncoder delegate = new BCryptPasswordEncoder()

    String encode(@NotBlank @NonNull String rawPassword) {
        delegate.encode(rawPassword)
    }

    @Override
    boolean matches(@NotBlank @NonNull String rawPassword,
                    @NotBlank @NonNull String encodedPassword) {
        delegate.matches(rawPassword, encodedPassword)
    }
}