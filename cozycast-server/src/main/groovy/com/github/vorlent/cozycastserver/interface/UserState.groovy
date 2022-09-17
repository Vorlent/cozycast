package com.github.vorlent.cozycastserver

interface UserState {

    String getUsername()

    String getPassword()

    String getAvatarUrl()

    String getNameColor()

    boolean isEnabled()

    boolean isAccountExpired()

    boolean isAccountLocked()

    boolean isPasswordExpired()
}