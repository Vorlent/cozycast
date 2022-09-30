package com.github.vorlent.cozycastserver

import com.github.vorlent.cozycastserver.service.UserGormService
import com.github.vorlent.cozycastserver.domain.User

import io.micronaut.security.authentication.Authentication
import io.micronaut.security.errors.OauthErrorResponseException
import io.micronaut.security.token.event.RefreshTokenGeneratedEvent
import io.micronaut.security.token.refresh.RefreshTokenPersistence
import jakarta.inject.Singleton
import org.reactivestreams.Publisher
import reactor.core.publisher.Flux
import reactor.core.publisher.FluxSink

import java.time.format.DateTimeFormatter
import java.time.ZonedDateTime
import java.time.ZoneId

import static io.micronaut.security.errors.IssuingAnAccessTokenErrorCode.INVALID_GRANT

import groovy.util.logging.Slf4j

@Slf4j
@Singleton
class CustomRefreshTokenPersistence implements RefreshTokenPersistence {


    private final UserGormService userGormService

    CustomRefreshTokenPersistence(UserGormService userGormService){
        this.userGormService = userGormService;
    }

    @Override
    public void persistToken(final RefreshTokenGeneratedEvent event) {
        userGormService.updateRefreshTokenAndTokenCreated(event.authentication.name, event.refreshToken, ZonedDateTime.now(ZoneId.of("UTC")));
    }

    @Override
    public Publisher<Authentication> getAuthentication(final String refreshToken) {
        return Flux.create({ emitter ->
            User user = userGormService.findByRefreshToken(refreshToken);
            if (user != null) {
                if(user.tokenRevoked){
                    emitter.error(new OauthErrorResponseException(INVALID_GRANT, "refresh token revoked", null)) 
                } else {
                List<String> authorities = user.isAdmin() ? ["ROLE_ADMIN"] : [];
                emitter.next(Authentication.build(user.username, authorities))
                emitter.complete();
                }
            } else {
                emitter.error(new OauthErrorResponseException(INVALID_GRANT, "refresh token not found", null)) 
            }
        }, FluxSink.OverflowStrategy.ERROR)
    }

}
