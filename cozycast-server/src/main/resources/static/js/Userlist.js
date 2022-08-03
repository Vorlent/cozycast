import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { showHover, hideHover } from '/js/UserHoverName.js'


export function Userlist({ state, isLeft }) {
    return html`
    <div id="userlist" class="userlist ${state.showUsernames ? "big" : "small"} ${isLeft ? "left" : "bottom"}" >
        ${state.userlist.map(user => html`
            <div class="user" >
                <div class="avatarContainer ${!state.showUsernames || isLeft ? "bar" : ""} " onMouseover=${e => showHover(e,user.username,isLeft ? "right" : "top",state.showUsernames)} onMouseout=${hideHover}>
                    <div class="image avatar ${user.active? "": "isAway"}" style="background-image: url('${user.url}');"/>
                    <div class="${user.remote ? "orangeCircle" : ""}"> </div>
                    <img class="mutedDot ${user.muted? "": "noDisplay"}" src="/svg/headphone-slash.svg"></img>
                    <img class="remoteIcon ${user.remote? "": "noDisplay"}" src="/svg/remote.svg"></img>
                    ${(!state.showUsernames || isLeft )&& false && html`<div class="hoverInfo ${isLeft ? "right" : "top"}">${user.username}</div>`}
                </div>
                ${state.showUsernames && !isLeft && html`<div class="${user.active? "": "isAway"} userprofileName">${user.username}</div>`}
            </div>
        `)}
    </div>
    <a id="copyright" href="/license" target="_blank" class="${isLeft ? "left" : "bottom"}">Copyright (C) 2022 Vorlent</a>
    `
}
