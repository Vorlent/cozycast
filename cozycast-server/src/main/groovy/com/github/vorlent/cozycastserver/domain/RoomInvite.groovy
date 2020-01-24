package com.github.vorlent.cozycastserver.domain

import grails.gorm.annotation.Entity
import java.time.ZonedDateTime
import java.time.ZoneId
import groovy.util.logging.Slf4j

import java.security.SecureRandom
import java.math.BigInteger

@Slf4j
@Entity
class RoomInvite {
    String id
    String room
    Integer uses = 0
    Integer maxUses
    ZonedDateTime expiration

    static String generateCode() {
        SecureRandom random = new SecureRandom()

        for(int i = 0; i <= 100; i++) {
            byte[] bytes = new byte[8]
            random.nextBytes(bytes)
            String code = new BigInteger(1, bytes).toString(36);
            if(!RoomInvite.get(code)) {
                return code
            } else {
                log.warn "Failed to generate the invite code because '${code}' was already taken."
            }
        }
        throw new RuntimeException("Failed to generate room invite")
    }

    boolean isExpired() {
        def now = ZonedDateTime.now(ZoneId.of("UTC"))
        return ((expiration && expiration > now)
            || (maxUses && uses >= maxUses))
    }

    static mapping = {
        id generator: 'assigned'
    }

    static constraints = {
        maxUses nullable: true
        expiration nullable: true
    }
}
