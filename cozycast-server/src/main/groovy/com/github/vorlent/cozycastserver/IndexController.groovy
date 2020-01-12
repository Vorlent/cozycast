package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Delete
import io.micronaut.http.HttpStatus
import io.micronaut.http.HttpResponse
import io.micronaut.core.io.ResourceResolver
import io.micronaut.http.annotation.Produces
import io.micronaut.http.server.types.files.StreamedFile
import io.micronaut.http.MediaType
import io.micronaut.http.HttpRequest
import javax.inject.Inject

@Controller("/")
public class IndexController {
    @Inject
    ResourceResolver res;

    @Get("/room{path:/?.*}")
    @Produces(MediaType.TEXT_HTML)
    public HttpResponse<?> room(HttpRequest<?> request, String path) {
        StreamedFile indexFile = new StreamedFile(res.getResource("classpath:static/index.html").get());
        return HttpResponse.ok(indexFile);
    }

    @Get("/management{path:/?.*}")
    @Produces(MediaType.TEXT_HTML)
    public HttpResponse<?> management(HttpRequest<?> request, String path) {
        StreamedFile indexFile = new StreamedFile(res.getResource("classpath:static/index.html").get());
        return HttpResponse.ok(indexFile);
    }
}
