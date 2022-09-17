package com.github.vorlent.cozycastserver

interface AuthoritiesFetcher {
    List<String> findAuthoritiesByUsername(String username)
}