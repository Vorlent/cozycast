package com.github.vorlent.cozycastserver




class UserSessionInfo {
    String userId
    String nickname
    String avatarUrl
    String nameColor
    Boolean anonymous
    Boolean invited
    Boolean admin
    Boolean verified
    Boolean trusted
    Boolean remote_permission
    Boolean image_permission
    Boolean banned = false

    UserSessionInfo(UserSession userSession) {
        // Copy required fields from userSession to this UserSessionSmall object
        this.userId = userSession.username
        this.avatarUrl = userSession.avatarUrl
        this.nameColor = userSession.nameColor
        this.nickname = userSession.nickname
        this.anonymous = userSession.anonymous
        this.invited = userSession.invited
        this.admin = userSession.admin
        this.trusted = userSession.trusted
        this.verified = userSession.verified
        this.remote_permission = userSession.remote_permission
        this.image_permission = userSession.image_permission
    }
}
