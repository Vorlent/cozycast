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
import io.micronaut.core.annotation.Nullable
import javax.inject.Inject

@Controller("/")
public class IndexController {
    @Inject
    ResourceResolver res;

    @Get("/js/{path:cozy.js}")
    @Produces(MediaType.TEXT_PLAIN)
    public HttpResponse<?> js(HttpRequest<?> request, String path) {
        StreamedFile indexFile = new StreamedFile(res.getResource("classpath:static/js/cozy.js").get());
        return HttpResponse.ok(indexFile).header("Cache-Control", "no-cache, max-age=604800");
    }

    @Get("/css/{path:styles.css}")
    @Produces(MediaType.TEXT_PLAIN)
    public HttpResponse<?> css(HttpRequest<?> request, String path) {
        StreamedFile indexFile = new StreamedFile(res.getResource("classpath:static/css/styles.css").get());
        return HttpResponse.ok(indexFile).header("Cache-Control", "no-cache, max-age=604800");
    }

    @Get(uris = ["/","/room/{/path:.*}","/management","/invite/{/path:.*}","/login","/register","/accounts",'/invites',"/permission","/profile","/cozysettings","/settings","/access/{/path:.*}"])
    @Produces(MediaType.TEXT_HTML)
    public HttpResponse<?> index(HttpRequest<?> request, @Nullable String path) {
        StreamedFile indexFile = new StreamedFile(res.getResource("classpath:static/index.html").get());
        return HttpResponse.ok(indexFile).header("Cache-Control", "no-cache, max-age=604800");
    }
}
