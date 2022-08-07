import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { updateState } from '/js/index.js'
import { sendMessage } from '/js/Room.js'

export function openProfile() {
    updateState(function (state) {
        state.profileModal = true;
    })
}

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
            editMode: false
        }
    }

    static getDerivedStateFromProps(props,state) {
        // This is dumb and can be avoided by having the props passed down as the correct value the first time around
        if (props.state.profileModal !== undefined && !state.editMode) {
          return {
            username: props.state.username,
            avatarUrl: props.state.avatarUrl,
            muteChatNotification: props.state.muteChatNotification,
            showUsernames: props.state.showUsernames,
            legacyDesign: props.state.legacyDesign,
            showIfMuted: props.state.showIfMuted,
            userlistOnLeft: props.state.userlistOnLeft,
            editMode: true
          };
        }
        return null;
    }

    shouldComponentUpdate(nextProps, nextState){
        return nextProps.state.profileModal != undefined || this.state.editMode
    }

    closeProfile = () => {
        updateState(function (state) {
            delete state.profileModal;
        })
        this.setState({editMode: false})
    }

    saveProfile = () => {
        updateState((state) => {
            if(state.profileModal) {
                state.muteChatNotification = this.state.muteChatNotification;
                state.showUsernames = this.state.showUsernames;
                state.legacyDesign = this.state.legacyDesign;
                state.showIfMuted = this.state.showIfMuted;
                if(state.showIfMuted != this.state.showIfMuted)
                    sendMessage({
                        action : 'userMuted',
                        muted: showMuted && (state.muted || state.videoPaused)
                    });
                state.userlistOnLeft = this.state.userlistOnLeft;
                if(state.username != this.state.username.substring(0, 12)){
                    state.username = this.state.username.substring(0, 12);
                    sendMessage({
                        action : 'changeusername',
                        username : state.username
                    });
                }
                if(state.avatarUrl != this.state.avatarUrl){
                    state.avatarUrl = this.state.avatarUrl;
                    sendMessage({
                        action : 'changeprofilepicture',
                        url : state.avatarUrl
                    });
                }   
                localStorage.setItem("username", state.username);
                localStorage.setItem("avatarUrl", state.avatarUrl);
                localStorage.setItem("muteChatNotification", state.muteChatNotification);
                localStorage.setItem("showUsernames", state.showUsernames);
                localStorage.setItem("legacyDesign", state.legacyDesign);
                localStorage.setItem("showIfMuted", state.showIfMuted);
                localStorage.setItem("userlistOnLeft", state.userlistOnLeft);
            }
        })
        this.closeProfile()
    }

    onInput = e => {
        this.setState({ username: e })
    }
    
    onSubmit = e => {
      console.log("Submitted ", this.state);
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
        return html`${state.profileModal && html`
            <div class="modal-background">
                <form class="profile modal" onSubmit=${this.onSubmit}>
                    <div class="title">
                        <div>
                            Profile
                        </div>
                        <button type="button" class="modal-close" onclick=${this.closeProfile}>X</button>
                    </div>
                    <div class="image avatar big" style="background-image: url('${this.state.avatarUrl}');">
                        <div class="uploader-overlay" onclick=${() => document.getElementById('avatar-uploader').click()}>
                            <input id="avatar-uploader" type="file" name="avatar" accept="image/png, image/jpeg, image/webp" onchange=${this.avatarSelected}/>
                            <div class="center">Upload</div>
                        </div>
                    </div>
                    <div>
                        Username
                    </div>
                    <input class="modal-username" type="text"
                        onInput=${e => this.onInput(e.target.value)}
                        name="username" maxlength="12" value="${this.state.username}"/>
                    <div class="userOptions">
                        <div><input class="modal-username" type="checkbox" id="muteChatNotification" onClick=${e => this.toggle(e,'muteChatNotification')}
                            name="muteChatNotification" checked="${this.state.muteChatNotification}"/> <label for="muteChatNotification">Mute Chat Notification</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showUsernames" onClick=${e => this.toggle(e,'showUsernames')}
                            name="showUsernames" checked="${this.state.showUsernames}"/> <label for="showUsernames">Show Usernames</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="legacyDesign" onClick=${e => this.toggle(e,'legacyDesign')}
                            name="legacyDesign" checked="${this.state.legacyDesign}"/> <label for="legacyDesign">Use Legacy Design</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showIfMuted" onClick=${e => this.toggle(e,'showIfMuted')}
                            name="showIfMuted" checked="${this.state.showIfMuted}"/> <label for="showIfMuted">Show Others If Muted</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="userlistOnLeft" onClick=${e => this.toggle(e,'userlistOnLeft')}
                            name="userlistOnLeft" checked="${this.state.userlistOnLeft}"/> <label for="userlistOnLeft">Show Users On Left</label>
                        </div>
                    </div>
                    <button class="btn btn-primary" type="summit" >Save</button>
                </form>
        </div>`}`
    }
}
