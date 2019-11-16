package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.HttpStatus

import java.util.Date;
import java.lang.String;
import java.time.LocalDateTime;
import org.apache.commons.codec.digest.HmacUtils;
import org.apache.commons.codec.binary.Base64;
import java.time.temporal.ChronoUnit;
import groovy.transform.CompileStatic 

@CompileStatic
@Controller("/turn")
class TURNAuthController {

    @Get("/credential")
    TURNCredential credential() {
        String timestamp = String.valueOf(new Date().toInstant().plus(1, ChronoUnit.DAYS).getEpochSecond());
        String username = "cozycast";
        String temporaryUsername = timestamp + ":" + username;
        String secret = System.getenv("TURN_SECRET");
        byte[] hmac = HmacUtils.hmacSha1(secret, temporaryUsername);
        String credential = new String(Base64.encodeBase64(hmac));
        String turnIP = System.getenv("TURN_IP");

        return new TURNCredential(
            urls: "turn:" + turnIP + ":3478",
            username: temporaryUsername,
            credential: credential);
    }
}
