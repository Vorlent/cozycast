package com.github.vorlent.cozycastserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.context.annotation.Bean;


@EnableWebSocket
@SpringBootApplication
public class CozycastServerApplication implements WebSocketConfigurer {

	@Bean
  public StreamHandler streamHandler() {
      return new StreamHandler();
  }

	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(streamHandler(), "/stream");
	}

	public static void main(String[] args) {
		SpringApplication.run(CozycastServerApplication.class, args);
	}
}
