package com.github.vorlent.cozycastserver.security

import io.micronaut.security.authentication.providers.PasswordEncoder
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import javax.inject.Singleton

@Singleton
class BCryptPasswordEncoderService implements PasswordEncoder {

    org.springframework.security.crypto.password.PasswordEncoder delegate = new BCryptPasswordEncoder()

    String encode(String rawPassword) {
        return delegate.encode(rawPassword)
    }

    @Override
    boolean matches(String rawPassword, String encodedPassword) {
        return delegate.matches(rawPassword, encodedPassword)
    }
}
