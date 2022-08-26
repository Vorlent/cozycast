import { Component } from 'preact'
import { html } from 'htm/preact'
import { showHover, hideHover } from './UserHoverName.js'

export class Userlist extends Component {
    constructor() {
        super();
    }

    shouldComponentUpdate(nextProps, nextState){
        return this.props.userlist !== nextProps.userlist || 
            this.props.showUsernames !== nextProps.showUsernames ||
            this.props.isLeft !== nextProps.isLeft ||
            this.props.fullscreen !== nextProps.fullscreen;
    }

    render({userlist, showUsernames, isLeft, updateRoomState, fullscreen}) {
        return html`
        <div id="userlist" class="userlist ${showUsernames ? "big" : "small"} ${isLeft ? "left" : "bottom"} ${fullscreen ? "fullscreenUserlist" : ""}" >
            ${userlist.map(user => html`
                <div class="user" key=${user.session}>
                    <div class="avatarContainer ${!showUsernames || isLeft ? "bar" : ""} " onMouseover=${e => showHover(e,user.username,isLeft ? "right" : "top",showUsernames,updateRoomState)} onMouseout=${e => hideHover(updateRoomState)}>
                        <div class="image avatar ${user.active? "": "isAway"}" style="background-image: url('${user.url}');"/>
                        <div class="${user.remote ? "orangeCircle" : ""}"> </div>
                        <img class="mutedDot ${user.muted? "": "noDisplay"}" src="/svg/headphone-slash.svg"></img>
                        <img class="remoteIcon ${user.remote? "": "noDisplay"}" src="/svg/remote.svg"></img>
                        ${(!showUsernames || isLeft )&& false && html`<div class="hoverInfo ${isLeft ? "right" : "top"}">${user.username}</div>`}
                    </div>
                    ${showUsernames && !isLeft && html`<div class="${user.active? "": "isAway"} userprofileName">${user.username}</div>`}
                </div>
            `)}
        </div>
        <a id="copyright" href="/license" target="_blank" class="${isLeft ? "left" : "bottom"}">Copyright (C) 2022 Vorlent</a>
        `
    }
}
