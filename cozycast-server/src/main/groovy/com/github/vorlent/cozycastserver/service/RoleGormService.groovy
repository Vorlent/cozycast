package com.github.vorlent.cozycastserver.service

import com.github.vorlent.cozycastserver.domain.Role
import grails.gorm.services.Service

@Service(Role) 
interface RoleGormService {
    Role save(String authority)

    Role find(String authority)

    void delete(Serializable id)
}