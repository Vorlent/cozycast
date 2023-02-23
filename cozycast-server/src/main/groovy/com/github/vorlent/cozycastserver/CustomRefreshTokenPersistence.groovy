package com.github.vorlent.cozycastserver

import com.github.vorlent.cozycastserver.service.UserGormService
import com.github.vorlent.cozycastserver.domain.RefreshToken
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
        RefreshToken.withTransaction {
            RefreshToken.where { username == event.authentication.name}
                .list(sort: 'tokenCreated', order: 'desc', offset: 2).each { it.delete() }
            new RefreshToken(
                username: event.authentication.name,
                refreshToken: event.refreshToken,
                tokenRevoked: false,
                tokenCreated: ZonedDateTime.now(ZoneId.of("UTC"))
            ).save()
        }
        log.info "Finished creating token $event.authentication.name"
    }

    @Override
    public Publisher<Authentication> getAuthentication(final String refreshToken) {
        return Flux.create({ emitter ->
            RefreshToken token;
            RefreshToken.withTransaction {
                token = RefreshToken.findByRefreshToken(refreshToken);
            }

            if (token != null) {
                if(token.tokenRevoked){
                    emitter.error(new OauthErrorResponseException(INVALID_GRANT, "refresh token revoked", null)) 
                } else {
                User user = userGormService.findByUsername(token.username);
                if(user != null){
                    List<String> authorities = user.isAdmin() ? ["ROLE_ADMIN"] : [];
                    emitter.next(Authentication.build(user.username, authorities))
                    emitter.complete();
                }
                else {
                    emitter.error(new OauthErrorResponseException(INVALID_GRANT, "user not found", null)) 
                }
                }
            } else {
                emitter.error(new OauthErrorResponseException(INVALID_GRANT, "refresh token not found", null)) 
            }
        }, FluxSink.OverflowStrategy.ERROR)
    }

}
