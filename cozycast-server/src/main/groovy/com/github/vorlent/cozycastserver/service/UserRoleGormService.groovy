package com.github.vorlent.cozycastserver.service

import com.github.vorlent.cozycastserver.domain.Role
import com.github.vorlent.cozycastserver.domain.User
import com.github.vorlent.cozycastserver.domain.UserRole
import grails.gorm.services.Query
import grails.gorm.services.Service

@Service(UserRole) 
interface UserRoleGormService {

    UserRole save(User user, Role role)

    UserRole find(User user, Role role)

    void delete(Serializable id)

    @Query("""select $r.authority
    from ${UserRole ur}
    inner join ${User u = ur.user}
    inner join ${Role r = ur.role}
    where $u.username = $username""") 
    List<String> findAllAuthoritiesByUsername(String username)
}