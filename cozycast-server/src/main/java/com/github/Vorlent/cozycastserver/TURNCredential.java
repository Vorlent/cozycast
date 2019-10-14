package com.github.vorlent.cozycastserver;

public class TURNCredential {

    private final String urls;
    private final String username;
    private final String credential;

    public TURNCredential(String urls, String username, String credential) {
        this.urls = urls;
        this.username = username;
        this.credential = credential;
    }

    public String getUrls() {
        return urls;
    }

    public String getUsername() {
        return username;
    }

    public String getCredential() {
        return credential;
    }
}
