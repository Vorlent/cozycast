import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { RemoteIcon } from '/js/RemoteIcon.js'

export function Userlist({ state }) {
    return html`<div id="userlist" class="userlist ${state.showUsernames ? "bigUserlist" : "smallUserlist" }" >
        ${state.userlist.map(user => html`
            <div class="user ${user.active? "": "isAway"}">
                <div class="image avatar" style="background-image: url('${user.url}');" title="${user.username}">
                    <div class="${user.remote ? "orangeCircle" : ""}"> </div>
                    <img class="mutedDot ${user.muted? "": "noDisplay"}" src="svg/headphone-slash.svg"></img>
                    <img class="remoteIcon ${user.remote? "": "noDisplay"}" src="svg/remote.svg"></img>
                </div>
                ${state.showUsernames && html`<div>${user.username}</div>`}
            </div>
        `)}
    </div>
    <a id="copyright" href="/license" target="_blank">Copyright (C) 2022 Vorlent</a>
    `
}
