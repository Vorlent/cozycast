package com.github.vorlent.cozycastserver

import com.github.vorlent.cozycastserver.service.RegisterService

import groovy.transform.CompileStatic
import io.micronaut.context.event.ApplicationEventListener
import io.micronaut.runtime.Micronaut
import io.micronaut.runtime.server.event.ServerStartupEvent
import jakarta.inject.Singleton

@CompileStatic
@Singleton
class Application implements ApplicationEventListener<ServerStartupEvent> { 

    private final RegisterService registerService

    Application(RegisterService registerService) { 
        this.registerService = registerService
    }

    @Override
    void onApplicationEvent(ServerStartupEvent event) { 
        registerService.register('test@user.example', 'username', 'password', true) 
    }

    static void main(String[] args) {
        Micronaut.run Application, args
    }
}