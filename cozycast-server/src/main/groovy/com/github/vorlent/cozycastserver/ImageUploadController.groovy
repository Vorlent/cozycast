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
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule

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

import org.apache.tika.Tika
import org.apache.tika.metadata.Metadata
import org.apache.tika.metadata.TikaCoreProperties
import groovy.util.logging.Slf4j

import com.github.vorlent.cozycastserver.service.WebsocketRoomService

class ImageUploadResponse {
    String url
    String type
}

@Secured("isAnonymous()")
@Slf4j
@Controller("/image")
class ImageController {

    private final WebsocketRoomService websocketRoomService

    ImageController(WebsocketRoomService websocketRoomService) {
        this.websocketRoomService = websocketRoomService
    }

    String imageDirectory = "/var/cozycast/image"

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

    private String fileExtension(ByteArrayInputStream stream, String filename) {
        Tika tika = new Tika()
        Metadata metadata = new Metadata()
        metadata.set(Metadata.RESOURCE_NAME_KEY, filename)
        String mimeType = tika.detect(stream, metadata)

        log.info "MIME TYPE ${mimeType}"
        switch(mimeType) {
            case "video/webm":
                return ".webm"
            case "video/mp4":
                return ".mp4";
            case "image/jpeg":
                return ".jpg"
            case "image/png":
                return ".png"
            case "image/gif":
                return ".gif"
            case "image/webp":
                return ".webp"
            default:
                return null
        }
    }

    @Secured(SecurityRule.IS_AUTHENTICATED)
    @Post(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA)
    def upload(CompletedFileUpload image, String room, Authentication authentication) {
        log.info "room upload: $room"
        try {
            if(!websocketRoomService.checkImageRights(room,authentication.getName())){
                return HttpResponse.unauthorized();
            }
            String filename = generateFilename();
            byte[] content = image.getBytes();
            String fileExt = fileExtension(new ByteArrayInputStream(content), image.filename);
            log.info "Uploading file: $filename.$fileExt"
            if(fileExt != null) {
                Path path = new File(imageDirectory, filename + fileExt).toPath();
                Files.write(path, content);
                websocketRoomService.chatMedia(room, authentication.getName(), "/image/asset/" + filename + fileExt, (fileExt.endsWith(".webm") || fileExt.endsWith(".mp4")) ? "video" : "image");
                return HttpResponse.ok()
            } else {
                return HttpResponse.badRequest()
            }
        } catch(IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Get("/asset/{filename:.+}")
    public HttpResponse<?> download(String filename) {
        try {
            File file = new File(imageDirectory, filename);
            log.info "Dowloaded file: $file"
            if(file.getCanonicalFile().getParentFile().equals(new File(imageDirectory))) {
                return HttpResponse.ok(new SystemFile(file)).header("Cache-Control", "private, max-age=5400");;
            } else {
                throw new RuntimeException("Invalid filename");
            }
        } catch(IOException e) {
            throw new RuntimeException(e);
        }
    }

}
