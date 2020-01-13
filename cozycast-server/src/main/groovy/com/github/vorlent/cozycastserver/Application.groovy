package com.github.vorlent.cozycastserver

import io.micronaut.runtime.Micronaut
import groovy.transform.CompileStatic
import javax.inject.Singleton
import io.micronaut.runtime.Micronaut
import io.micronaut.context.event.ApplicationEventListener
import io.micronaut.runtime.server.event.ServerStartupEvent
import com.github.vorlent.cozycastserver.security.RegisterService

@CompileStatic
@Singleton
class Application implements ApplicationEventListener<ServerStartupEvent> {

    protected final RegisterService registerService

    Application(RegisterService registerService) {
        this.registerService = registerService
    }

    @Override
    void onApplicationEvent(ServerStartupEvent event) {
        if(System.getenv("COZYCAST_INIT_ADMIN_PASSWORD") != null) {
            registerService.register("admin", System.getenv("COZYCAST_INIT_ADMIN_PASSWORD"), true)
        }
    }

    static void main(String[] args) {
        Micronaut.run(Application)
    }
}
