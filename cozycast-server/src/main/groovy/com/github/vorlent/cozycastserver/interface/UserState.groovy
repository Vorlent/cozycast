package com.github.vorlent.cozycastserver

interface UserState {

    String getUsername()

    String getNickname()

    String getPassword()

    String getAvatarUrl()

    String getNameColor()

    boolean isAdmin()

    boolean isEnabled()

    boolean isAccountExpired()

    boolean isAccountLocked()

    boolean isPasswordExpired()
}