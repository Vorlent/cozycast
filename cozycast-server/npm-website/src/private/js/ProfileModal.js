import { Component, h } from 'preact'

export class ProfileModal extends Component {
    constructor(props) {
        super(props);
        //since profileModal is the only component changing these states it's okay to intitalize it like this
        this.state = {
            username: props.state.username,
            avatarUrl: props.state.avatarUrl,
            muteChatNotification: props.state.muteChatNotification,
            showUsernames: props.state.showUsernames,
            legacyDesign: props.state.legacyDesign,
            showIfMuted: props.state.showIfMuted,
            userlistOnLeft: props.state.userlistOnLeft,
            transparentChat: props.state.transparentChat,
            editMode: false
        }
    }

    static getDerivedStateFromProps(props,state) {
        // This is suboptimal and can be avoided by having the props passed down as the correct value the first time around
        if (props.state.profileModal !== undefined && !state.editMode) {
          return {
            username: props.state.username,
            avatarUrl: props.state.avatarUrl,
            muteChatNotification: props.state.muteChatNotification,
            showUsernames: props.state.showUsernames,
            legacyDesign: props.state.legacyDesign,
            showIfMuted: props.state.showIfMuted,
            userlistOnLeft: props.state.userlistOnLeft,
            transparentChat: props.state.transparentChat,
            editMode: true
          };
        }
        return null;
    }

    shouldComponentUpdate(nextProps, nextState){
        return nextProps.state.profileModal != undefined || this.state.editMode
    }

    closeProfile = () => {
        this.props.updateRoomState({profileModal: undefined})
        this.setState({editMode: false})
    }

    saveProfile = () => {
        if(this.props.state.showIfMuted != this.state.showIfMuted)
            this.props.sendMessage({
                action : 'userMuted',
                muted: this.state.showMuted && (this.props.state.muted || this.props.state.videoPaused)
            });
        let newUsername = this.props.state.username;
        if(newUsername != this.state.username.substring(0, 12)){
            newUsername = this.state.username.substring(0, 12);
            this.props.sendMessage({
                action : 'changeusername',
                username : newUsername
            });
        }
        let newAvatarUrl = this.props.state.avatarUrl;
        if(newAvatarUrl  != this.state.avatarUrl){
            newAvatarUrl = this.state.avatarUrl;
            this.props.sendMessage({
                action : 'changeprofilepicture',
                url : newAvatarUrl
        });
        }   
        this.props.updateRoomState({
            muteChatNotification: this.state.muteChatNotification,
            showUsernames: this.state.showUsernames,
            showIfMuted: this.state.showIfMuted,
            userlistOnLeft: this.state.userlistOnLeft,
            transparentChat: this.state.transparentChat,
            avatarUrl: newAvatarUrl,
            username: newUsername
        })
        this.props.setAppState({
            legacyDesign: this.state.legacyDesign
        })

        localStorage.setItem("username", this.state.username);
        localStorage.setItem("avatarUrl", this.state.avatarUrl);
        localStorage.setItem("muteChatNotification", this.state.muteChatNotification);
        localStorage.setItem("showUsernames", this.state.showUsernames);
        localStorage.setItem("legacyDesign", this.state.legacyDesign);
        localStorage.setItem("showIfMuted", this.state.showIfMuted);
        localStorage.setItem("userlistOnLeft", this.state.userlistOnLeft);
        localStorage.setItem("transparentChat",this.state.transparentChat);
        this.closeProfile()
    }

    onInput = e => {
        this.setState({ username: e })
    }
    
    onSubmit = e => {
      e.preventDefault();
      this.saveProfile();
    }

    toggle = (e,name) => {
        let checked = this.state[name];
        if(checked === undefined) return;
        this.setState({[name]: !checked})
    }

    avatarSelected = (e) => {
        let formData = new FormData();
        formData.append("avatar", e.target.files[0]);
        fetch('/avatar/upload', {method: "POST", body: formData}).then((e) => e.json()).then((e) => {
            if(e.url) {
                this.setState({avatarUrl: e.url});
            }
        });
    }

    render({ state }, { xyz = [] }) {
        return <div class="modal-background">
                <form class="profile modal" onSubmit={this.onSubmit}>
                    <div class="title">
                        <div>
                            Profile
                        </div>
                        <button type="button" class="modal-close" onclick={this.closeProfile}>X</button>
                    </div>
                    <div class="image avatar big" style={{'background-image': `url(${this.state.avatarUrl})`}}>
                        <div class="uploader-overlay" onclick={() => document.getElementById('avatar-uploader').click()}>
                            <input id="avatar-uploader" type="file" name="avatar" accept="image/png, image/jpeg, image/webp" onchange={this.avatarSelected}/>
                            <div class="center">Upload</div>
                        </div>
                    </div>
                    <div>
                        Username
                    </div>
                    <input class="modal-username" type="text"
                        onInput={e => this.onInput(e.target.value)}
                        name="username" maxlength="12" value={this.state.username}/>
                    <div class="userOptions">
                        <div class="usersubOptions">
                            <div><input class="modal-username" type="checkbox" id="muteChatNotification" onClick={e => this.toggle(e,'muteChatNotification')}
                                name="muteChatNotification" checked={this.state.muteChatNotification}/> <label for="muteChatNotification">Mute Chat Notification</label>
                            </div>
                            <div><input class="modal-username" type="checkbox" id="legacyDesign" onClick={e => this.toggle(e,'legacyDesign')}
                                name="legacyDesign" checked={this.state.legacyDesign}/> <label for="legacyDesign">Use Legacy Design</label>
                            </div>
                            <div><input class="modal-username" type="checkbox" id="showIfMuted" onClick={e => this.toggle(e,'showIfMuted')}
                                name="showIfMuted" checked={this.state.showIfMuted}/> <label for="showIfMuted">Show Others If Muted</label>
                            </div>
                        </div>
                        <div class="usersubOptions">
                            <div><input class="modal-username" type="checkbox" id="showUsernames" onClick={e => this.toggle(e,'showUsernames')}
                                name="showUsernames" checked={this.state.showUsernames}/> <label for="showUsernames">Show Usernames</label>
                            </div>
                            <div><input class="modal-username" type="checkbox" id="userlistOnLeft" onClick={e => this.toggle(e,'userlistOnLeft')}
                                name="userlistOnLeft" checked={this.state.userlistOnLeft}/> <label for="userlistOnLeft">Show Users On Left</label>
                            </div>
                            <div><input class="modal-username" type="checkbox" id="transparentChat" onClick={e => this.toggle(e,'transparentChat')}
                                name="transparentChat" checked={this.state.transparentChat}/> <label for="transparentChat">Fullscreen Transparent Chat</label>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-primary" type="summit" >Save</button>
                </form>
        </div>
    }
}
