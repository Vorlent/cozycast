package com.github.vorlent.cozycastserver.service

import groovy.transform.CompileStatic
import jakarta.inject.Singleton

import javax.validation.ConstraintViolation
import javax.validation.Path

@CompileStatic
@Singleton
class MessageSource {

    List<String> violationsMessages(Set<ConstraintViolation<?>> violations) {
        violations.collect {violationMessage(it) }
    }

    private String violationMessage(ConstraintViolation violation) {
        StringBuilder sb = new StringBuilder()
        sb << violation.message
        sb
    }

    private static Path.Node lastNode(Path path) {
        Path.Node lastNode = null
        for (final Path.Node node : path) {
            lastNode = node
        }
        return lastNode
    }
}