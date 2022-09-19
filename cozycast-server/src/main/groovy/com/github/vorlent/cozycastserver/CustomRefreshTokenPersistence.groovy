package com.github.vorlent.cozycastserver

import com.github.vorlent.cozycastserver.service.UserGormService
import com.github.vorlent.cozycastserver.domain.User
import com.github.vorlent.cozycastserver.AuthoritiesFetcher

import io.micronaut.security.authentication.Authentication
import io.micronaut.security.errors.OauthErrorResponseException
import io.micronaut.security.token.event.RefreshTokenGeneratedEvent
import io.micronaut.security.token.refresh.RefreshTokenPersistence
import jakarta.inject.Singleton
import org.reactivestreams.Publisher
import reactor.core.publisher.Flux
import reactor.core.publisher.FluxSink

import static io.micronaut.security.errors.IssuingAnAccessTokenErrorCode.INVALID_GRANT

import groovy.util.logging.Slf4j

@Slf4j
@Singleton
class CustomRefreshTokenPersistence implements RefreshTokenPersistence {


    private final UserGormService userGormService
    private final AuthoritiesFetcher authoritiesFetcher

    CustomRefreshTokenPersistence(UserGormService userGormService,AuthoritiesFetcher authoritiesFetcher){
        this.userGormService = userGormService;
        this.authoritiesFetcher = authoritiesFetcher;
    }

    @Override
    public void persistToken(final RefreshTokenGeneratedEvent event) {
        userGormService.updateUsername(event.authentication.name, event.refreshToken);
    }

    @Override
    public Publisher<Authentication> getAuthentication(final String refreshToken) {
        return Flux.create({ emitter ->
            User user = userGormService.findByRefreshToken(refreshToken);
            if (user != null) {
                if(user.tokenRevoked){
                    emitter.error(new OauthErrorResponseException(INVALID_GRANT, "refresh token revoked", null)) 
                } else {
                emitter.next(Authentication.build(user.username,authoritiesFetcher.findAuthoritiesByUsername(user.username)));
                emitter.complete();
                }
            } else {
                emitter.error(new OauthErrorResponseException(INVALID_GRANT, "refresh token not found", null)) 
            }
        }, FluxSink.OverflowStrategy.ERROR)
    }

}
