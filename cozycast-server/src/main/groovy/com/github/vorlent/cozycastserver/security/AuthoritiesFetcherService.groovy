package com.github.vorlent.cozycastserver.security

import io.micronaut.security.authentication.providers.AuthoritiesFetcher
import io.reactivex.Flowable
import org.reactivestreams.Publisher

import javax.inject.Singleton
import com.github.vorlent.cozycastserver.domain.User

@Singleton
class AuthoritiesFetcherService implements AuthoritiesFetcher {

    @Override
    Publisher<List<String>> findAuthoritiesByUsername(String username) {
        User user = null
        User.withTransaction {
            user = User.findByUsername(username)
        }
        def roles = []
        if(user && user.admin) {
            roles.add("ROLE_ADMIN")
        }
        Flowable.just(roles)
    }
}
