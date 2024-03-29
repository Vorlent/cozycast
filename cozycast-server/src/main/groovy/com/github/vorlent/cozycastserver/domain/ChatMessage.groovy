package com.github.vorlent.cozycastserver.domain

import grails.gorm.annotation.Entity
import java.time.ZonedDateTime
import groovy.util.logging.Slf4j

@Slf4j
@Entity
class ChatMessage {
    String id
    String session
    String room
    String username
    String message
    String type
    String image
    String nameColor
    boolean edited
    boolean anonymous
    ZonedDateTime timestamp

    void afterDelete() {
        if(this.image) {
            String imageDirectory = "/var/cozycast/image"
            try {
                File file = new File(imageDirectory, this.image?.replaceAll("/image/asset/",""))
                file.delete()
                log.info "Deleted file: $file"
            } catch(IOException e) {
                log.error "Deleting file $file failed."
            }
        }
    }

    static mapping = {
        id generator: 'uuid2'
    }

    static constraints = {
        message maxSize: 4096
        image nullable: true
        type nullable: true
    }
}
