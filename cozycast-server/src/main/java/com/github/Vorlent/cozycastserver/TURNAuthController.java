package com.github.vorlent.cozycastserver;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.Date;
import java.lang.String;
import java.time.LocalDateTime;
import org.apache.commons.codec.digest.HmacUtils;
import org.apache.commons.codec.binary.Base64;
import java.time.temporal.ChronoUnit;

@RestController
public class TURNAuthController {

    @RequestMapping("/turn/credential")
    public TURNCredential credential() {
        String timestamp = String.valueOf(new Date().toInstant().plus(1, ChronoUnit.DAYS).getEpochSecond());
        String username = "cozycast";
        String temporaryUsername = timestamp + ":" + username;
        String secret = System.getenv("TURN_SECRET");
        byte[] hmac = HmacUtils.hmacSha1(secret, temporaryUsername);
        String credential = new String(Base64.encodeBase64(hmac));
        String turnIP = System.getenv("EXTERNAL_IP");
        return new TURNCredential("turn:" + turnIP + ":3478", temporaryUsername, credential);
    }
}
