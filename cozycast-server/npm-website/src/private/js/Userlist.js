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
            this.props.remote !== nextProps.remote ||
            this.props.smallPfp !== nextProps.smallPfp;
    }

    render({userlist, showUsernames, isLeft, updateRoomState, fullscreen, hasRemote, smallPfp}) {
        return <div id="userlist" class={`userlist ${smallPfp ? "smallPfp" : ""} ${showUsernames ? "big" : "small"} ${isLeft ? "left" : "bottom"} ${fullscreen ? "fullscreenUserlist" : ""} ${hasRemote ? " hasRemote": ""}`} >
                {userlist.map(user => {
                let background = {'background-image': `url(${user.url})`};
                if(user.anonymous) background['background-color'] = user.nameColor + "99"
                {return <div class="user" key={user.session}>
                        <div class={`avatarContainer ${!showUsernames || isLeft ? "bar" : ""}`} 
                        onMouseover={e => showHover(e,user.username,isLeft ? "right" : "top",showUsernames,user.active,updateRoomState)} onMouseout={e => hideHover(updateRoomState)}>
                            <div class={`image avatar ${user.active? "": "isAway"}`} style={background}/>
                            {user.remote && <div class="orangeCircle"></div>}
                            <div class={`mutedDot ${user.muted? "": "noDisplay"}`}>
                                <img class="mutedDotIcon" src="/svg/headphone-slash.svg"></img>
                            </div>
                            <div class={`remoteIcon ${user.remote? "": "noDisplay"}`} >
                                <img class="remoteIconIcon" src="/svg/remoteAlpha.svg"></img>
                            </div>
                            
                        </div>
                        {showUsernames && !(smallPfp && isLeft) && <div class={`${user.active? "": "isAway"} userprofileName`}>{user.username}</div>}
                    </div>
                    }
                })}
            </div>
    }
}
