package com.github.vorlent.cozycastserver;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.lang.String;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.io.SequenceInputStream;
import org.springframework.core.io.InputStreamResource;
import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.PathVariable;
import java.io.File;
import java.util.Random;
import java.security.MessageDigest;
import java.math.BigInteger;
import java.security.NoSuchAlgorithmException;
import org.springframework.core.io.FileSystemResource;
import com.google.gson.JsonObject;

@RestController
public class AvatarController {

    private String avatarDirectory = "/var/cozycast/avatar";

    private String generateFilename() {
        try {
            byte[] array = new byte[64];
            new Random().nextBytes(array);
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String text = "Text to hash, cryptographically.";

            md.update(array);
            byte[] digest = md.digest();
            
            return String.format("%064x", new BigInteger(1, digest));
        } catch(NoSuchAlgorithmException e) {
            throw new RuntimeException("Error failed to generate filename");
        }
    }

    @RequestMapping(value="/avatar/upload")
    public String upload(@RequestPart("avatar") MultipartFile file) {
        try {
            String filename = generateFilename() + ".jpg";
            System.out.println(filename);
            file.transferTo(new File(avatarDirectory, filename));
            JsonObject response = new JsonObject();
            response.addProperty("url", "/avatar/image/"+filename);
            return response.toString();
        } catch(IOException e) {
            throw new RuntimeException(e);
        }
    }

    @RequestMapping(value="/avatar/image/{filename:.+}")
    public FileSystemResource upload(@PathVariable String filename) {
        try {
            File file = new File(avatarDirectory, filename);
            System.out.println(file);
            if(file.getCanonicalFile().getParentFile().equals(new File(avatarDirectory))) {
                return new FileSystemResource(file);
            } else {
                throw new RuntimeException("Invalid filename");
            }
        } catch(IOException e) {
            throw new RuntimeException(e);
        }
    }
}
