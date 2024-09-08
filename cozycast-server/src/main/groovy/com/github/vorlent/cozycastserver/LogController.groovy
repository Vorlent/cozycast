package com.github.vorlent.cozycastserver

import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.server.types.files.StreamedFile;


import io.micronaut.security.annotation.Secured
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@Controller("/log")
public class LogController {

    @Get(value = "/vm-management", produces = MediaType.TEXT_PLAIN)
    public HttpResponse<StreamedFile> getVmManagementLog() throws IOException {
        File logFile = new File("vm_management.log");

        if (!logFile.exists()) {
            return HttpResponse.notFound();
        }

        FileInputStream fileInputStream = new FileInputStream(logFile);
        StreamedFile streamedFile = new StreamedFile(fileInputStream, MediaType.TEXT_PLAIN_TYPE);

        return HttpResponse.ok(streamedFile);
    }

    // Only admins can clear logs
    @Secured("ROLE_ADMIN")
    @Delete(value = "/vm-management", produces = MediaType.TEXT_PLAIN)
    public HttpResponse<String> clearVmManagementLog() {
        File logFile = new File("vm_management.log");

        if (!logFile.exists()) {
            return HttpResponse.notFound("Log file not found");
        }

        try (FileOutputStream fileOutputStream = new FileOutputStream(logFile)) {
            // Clearing the file by writing an empty string
            fileOutputStream.write(new byte[0]);
            return HttpResponse.ok("Log file cleared successfully");
        } catch (IOException e) {
            return HttpResponse.serverError("Failed to clear log file");
        }
    }
}