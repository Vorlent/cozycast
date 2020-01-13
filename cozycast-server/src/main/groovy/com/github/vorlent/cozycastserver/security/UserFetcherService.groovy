package com.github.vorlent.cozycastserver.security

import groovy.transform.CompileStatic
import io.micronaut.security.authentication.providers.UserFetcher
import io.micronaut.security.authentication.providers.UserState
import io.reactivex.Flowable
import org.reactivestreams.Publisher
import com.github.vorlent.cozycastserver.domain.User

import javax.inject.Singleton

@Singleton
class UserFetcherService implements UserFetcher {

    @Override
    Publisher<UserState> findByUsername(String username) {
        UserState user = null
        User.withTransaction {
            user = User.findByUsername(username) as UserState
        }
        (user ? Flowable.just(user) : Flowable.empty()) as Publisher<UserState>
    }
}
