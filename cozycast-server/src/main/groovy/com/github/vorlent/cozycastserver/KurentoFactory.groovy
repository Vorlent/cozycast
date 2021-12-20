package com.github.vorlent.cozycastserver

import io.micronaut.context.annotation.Factory
import javax.inject.Singleton

import org.kurento.client.KurentoClient


@Factory
class KurentoFactory {
    @Singleton
    KurentoClient kurentoClient() {
        return KurentoClient.create("ws://${System.getenv("KURENTO_IP")}:8888/kurento")
    }
}
