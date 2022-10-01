import { Component, Fragment, h } from 'preact'
import { showHover, hideHover } from './UserHoverName.js'

export class Userlist extends Component {
    constructor() {
        super();
    }

    shouldComponentUpdate(nextProps, nextState){
        return this.props.userlist !== nextProps.userlist || 
            this.props.showUsernames !== nextProps.showUsernames ||
            this.props.isLeft !== nextProps.isLeft ||
            this.props.fullscreen !== nextProps.fullscreen ||
            this.props.remote !== nextProps.remote;
    }

    render({userlist, showUsernames, isLeft, updateRoomState, fullscreen, hasRemote}) {
        return <Fragment>
            <div id="userlist" class={`userlist ${showUsernames ? "big" : "small"} ${isLeft ? "left" : "bottom"} ${fullscreen ? "fullscreenUserlist" : ""} ${hasRemote ? " hasRemote": ""}`} >
                {userlist.map(user => {
                let background = {'background-image': `url(${user.url})`};
                if(user.anonymous) background['background-color'] = user.nameColor + "99"
                {return <div class="user" key={user.session}>
                        <div class={`avatarContainer ${!showUsernames || isLeft ? "bar" : ""}`} 
                        onMouseover={e => showHover(e,user.username,isLeft ? "right" : "top",showUsernames,user.active,updateRoomState)} onMouseout={e => hideHover(updateRoomState)}>
                            <div class={`image avatar ${user.active? "": "isAway"}`} style={background}/>
                            {user.remote && <div class="orangeCircle"></div>}
                            <img class={`mutedDot ${user.muted? "": "noDisplay"}`} src="/svg/headphone-slash.svg"></img>
                            <img class={`remoteIcon ${user.remote? "": "noDisplay"}`} src="/svg/remote.svg"></img>
                        </div>
                        {showUsernames && !isLeft && <div class={`${user.active? "": "isAway"} userprofileName`}>{user.username}</div>}
                    </div>
                    }
                })}
            </div>
            <a id="copyright" href="/license" target="_blank" class={isLeft ? "left" : "bottom"}>Copyright (C) 2022 Vorlent</a>
        </Fragment>
    }
}
