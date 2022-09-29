import { h, Component } from 'preact'
import { route } from 'preact-router'

export class UserModal extends Component {

    render({ username, avatarUrl }) {
        return  <div class="userSidebar" style={{position: "absolute", right: "1em"}} onclick={e => route("/login", true)}>
                    <div class="avatarContainerModal">
                        <div class="image avatarModal" style={{ 'background-image': `url(${avatarUrl})` }} />
                    </div>
                    <div class="usernameSidebar">
                        <div class="usernameList">{username}</div>
                    </div>
                 </div>
            ;
    }
}