import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

export function UserlistSidebar({ state }) {
    return html`<div class="userlistSidebar">
        ${state.userlist.map(user => html`
            <div class="userSidebar">
                <div class="image avatar" style="background-image: url('${user.url}');"/>
                <div class="usernameSidebar">${user.username}</div>
            </div>
        `)}
    </div>
    `
}