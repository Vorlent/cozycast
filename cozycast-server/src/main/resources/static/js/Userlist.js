import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

export function Userlist({ state }) {
    return html`<div id="userlist" class="userlist ${state.showUsernames ? "bigUserlist" : "smallUserlist" }" >
        ${state.userlist.map(user => html`
            <div class="user">
                <div class="image avatar" style="background-image: url('${user.url}');" title="${user.username}">
                    <div class="onlineDot ${user.active? "isOnline": "isInactive"}"></div>
                </div>
                <div class="remote-wrapper">
                    <i class="icon-keyboard remote" style=${user.remote ? "" : "display: none;"}></i>
                </div>
                ${state.showUsernames && html`<div>${user.username}</div>`}
            </div>
        `)}
    </div>
    <a id="copyright" href="/license" target="_blank">Copyright (C) 2022 Vorlent</a>
    `
}
