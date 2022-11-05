package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.QueryValue
import io.micronaut.core.annotation.Nullable
import javax.validation.constraints.Null
import javax.validation.constraints.Size
import io.micronaut.http.HttpStatus
import io.micronaut.http.HttpResponse
import io.micronaut.security.annotation.Secured
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule
import groovy.util.logging.Slf4j
import java.time.ZonedDateTime
import java.time.ZoneId

import com.github.vorlent.cozycastserver.service.MiscService


@Slf4j
@Controller("/api/misc")
class MiscController {
    private final MiscService miscService;

    MiscController(MiscService miscService){
        this.miscService = miscService;
    }

    @Secured("ROLE_ADMIN")
    @Post("/message")
    Object updateMessage(@Size(max = 4096) @Nullable @Body String message) {
        log.info message
        this.miscService.updateMessage(message);
        return HttpResponse.status(HttpStatus.OK);
    }


    @Secured("ROLE_ADMIN")
    @Post("/inviteOnly")
    Object updateFlag(@Body String flag) {
        boolean setFlag = flag == "true"
        this.miscService.updateRegisterFlag(setFlag);
        return HttpResponse.status(HttpStatus.OK);
    }

    @Get("/")
    Object getMiscInfo() {
        return this.miscService.getMiscInfo();
    }
}
