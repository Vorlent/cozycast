package com.github.vorlent.cozycastserver.security

import grails.gorm.transactions.Transactional
import groovy.transform.CompileStatic
import io.micronaut.security.authentication.providers.PasswordEncoder
import javax.inject.Singleton
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank
import groovy.util.logging.Slf4j

import com.github.vorlent.cozycastserver.domain.User

@Slf4j
@Singleton
class RegisterService {

    protected final PasswordEncoder passwordEncoder

    RegisterService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder
    }

    @Transactional
    void register(@NotBlank String username, @NotBlank String rawPassword, Boolean admin) {
        User.withTransaction {
            User user = User.findByUsername(username)
            if (!user) {
                final String encodedPassword = passwordEncoder.encode(rawPassword)
                user = new User(
                    username: username,
                    password: encodedPassword,
                    admin: admin)
                user.save(flush: true, failOnError: true)
                log.info "Created initial account for username ${username}"
            }
        }
    }
}
