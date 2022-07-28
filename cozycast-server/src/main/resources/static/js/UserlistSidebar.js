import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

export function UserlistSidebar({ state }) {
    return html`<div class="userlistSidebar">
        ${state.userlist.map(user => html`
            <div class="userSidebar">
                 <div class="avatarContainer">
                    <div class="image avatar" style="background-image: url('${user.url}');"/>
                    <div class="onlineDot ${user.active? "isOnline": "isInactive"}"></div>
                    <img class="mutedDot ${user.muted? "": "noDisplay"}" src="/svg/headphone-slash.svg"></img>
                </div>
                <div class="usernameSidebar">
                    <div class="username">${user.username}</div>
                    ${!user.active && html`
                        <div class="lastSeen">last seen: <span>${user.lastTimeSeen}</span></div>
                        `}
                </div>
            </div>
        `)}
    </div>
    `
}