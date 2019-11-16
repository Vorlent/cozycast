package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.HttpStatus
import io.micronaut.http.MediaType

import java.lang.String
import java.io.InputStream
import java.io.ByteArrayInputStream
import java.io.SequenceInputStream
import java.io.IOException


@Controller("/license")
class LicenseController {

    @Get(value = "/", produces = MediaType.TEXT_PLAIN)
    String license() {
        String licenseText = LicenseController.class.getResource("/LICENSE").text
    	String sourceUrl = "\nThe source code is available at " + System.getenv("SOURCE_URL");
        return licenseText + sourceUrl
    }
}
