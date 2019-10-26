package com.github.vorlent.cozycastserver;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.lang.String;
import org.springframework.core.io.ClassPathResource;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.io.SequenceInputStream;
import org.springframework.core.io.InputStreamResource;
import java.io.IOException;

@RestController
public class LicenseController {

    @RequestMapping(value="/license", produces = "text/plain; charset=utf-8")
    public InputStreamResource license() {
        try {
            ClassPathResource resource = new ClassPathResource("/LICENSE");
            InputStream resourceInputStream = resource.getInputStream();
            String sourceUrl = "\nThe source code is available at " + System.getenv("SOURCE_URL");
            InputStream sourceUrlStream = new ByteArrayInputStream(sourceUrl.getBytes("UTF-8"));
            return new InputStreamResource(new SequenceInputStream(resourceInputStream, sourceUrlStream));
        } catch(IOException e) {
            throw new RuntimeException(e);
        }
    }
}
