import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

export function Userlist({ state }) {
    return html`<div id="userlist" class="userlist">
        ${state.userlist.map(user => html`
            <div class="user">
                <div class="image avatar" style="background-image: url('${user.url}');">
                </div>
                <div class="remote-wrapper">
                    <i class="icon-keyboard remote" style=${user.remote ? "" : "display: none;"}></i>
                </div>
                <div>${user.username}</div>
            </div>
        `)}
    </div>`
}
