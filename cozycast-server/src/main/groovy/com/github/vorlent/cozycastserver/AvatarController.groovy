package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.Get
import io.micronaut.http.HttpStatus
import io.micronaut.http.MediaType
import io.micronaut.http.multipart.CompletedFileUpload
import io.micronaut.http.server.types.files.SystemFile
import io.micronaut.http.HttpResponse
import io.micronaut.security.annotation.Secured

import java.lang.String
import java.io.InputStream
import java.io.ByteArrayInputStream
import java.io.SequenceInputStream
import java.io.IOException
import java.io.File
import java.util.Random
import java.security.MessageDigest
import java.math.BigInteger
import java.security.NoSuchAlgorithmException
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.Files
import java.net.URLConnection

import groovy.util.logging.Slf4j


class AvatarUploadResponse {
    String url
}

@Secured("isAnonymous()")
@Slf4j
@Controller("/avatar")
class AvatarController {

    String avatarDirectory = "/var/cozycast/avatar"

    private String generateFilename() {
        try {
            byte[] array = new byte[64];
            new Random().nextBytes(array);
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(array);
            byte[] digest = md.digest();

            return String.format("%064x", new BigInteger(1, digest));
        } catch(NoSuchAlgorithmException e) {
            throw new RuntimeException("Error failed to generate filename");
        }
    }

    private String fileExtension(String mimeType) {
        switch(mimeType) {
            case "image/jpeg":
                return ".jpg"
            case "image/png":
                return ".png"
            case "image/gif":
                return ".gif"
            default:
                return null
        }
    }

    @Post(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA)
    def upload(CompletedFileUpload avatar) {
        try {
            String filename = generateFilename();
            log.info "Uploaded file: $filename"
            byte[] content = avatar.getBytes()
            String fileExt = fileExtension(URLConnection.guessContentTypeFromStream(new ByteArrayInputStream(content)));
            if(fileExt != null) {
                Path path = new File(avatarDirectory, filename + fileExt).toPath();
                Files.write(path, content);
                return new AvatarUploadResponse(url: "/avatar/image/${filename}${fileExt}")
            } else {
                return HttpResponse.badRequest()
            }
        } catch(IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Get("/image/{filename:.+}")
    public SystemFile download(String filename) {
        try {
            File file = new File(avatarDirectory, filename);
            log.info "Dowloaded file: $file"
            if(file.getCanonicalFile().getParentFile().equals(new File(avatarDirectory))) {
                return new SystemFile(file);
            } else {
                throw new RuntimeException("Invalid filename");
            }
        } catch(IOException e) {
            throw new RuntimeException(e);
        }
    }

}
