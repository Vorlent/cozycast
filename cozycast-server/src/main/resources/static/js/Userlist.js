import { html, Component } from '/js/libs/preact.standalone.module.js'

export function Userlist({ state }) {
    return html`<div id="userlist" class="userlist">
        ${state.userlist.map(user => html`
            <div class="user">
                <div class="image avatar" style="background-image: url('${user.url}');"/>
                <div>${user.username}</div>
                <i class="icon-keyboard remote" style=${user.remote ? "" : "display: none;"}></i>
            </div>
        `)}
    </div>`
}
