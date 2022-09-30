package com.github.vorlent.cozycastserver.service

import com.github.vorlent.cozycastserver.domain.RoomPermission
import com.github.vorlent.cozycastserver.domain.User
import grails.gorm.services.Service
import grails.gorm.services.Query
import java.time.ZonedDateTime

@Service(RoomPermission) 
interface RoomPermissionGormService {

    RoomPermission findAllByUserAndRoom(User user, String room)

    RoomPermission findByUserAndRoom(User user, String room)

    RoomPermission findAllByUser(User user)

    @Query("""select $rp
    from ${RoomPermission rp}
    inner join ${User u = rp.user}
    where $u.username = $userId""") 
    List<RoomPermission> findAllByUserId(String userId)

    int count()
}