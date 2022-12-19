import { Component, Fragment, h, createRef } from 'preact'
import { Button } from './Button';
import { route } from 'preact-router'
import { ProfileModal } from './ProfileModal';

export class UserRoomSettings extends Component {
    constructor(props) {
        super(props);
        //since UserRoomSettings is the only component changing these states it's okay to intitalize it like this
        this.state = {
            muteChatNotification: props.state.muteChatNotification,
            showUsernames: props.state.showUsernames,
            legacyDesign: props.legacyDesign,
            showIfMuted: props.state.showIfMuted,
            userlistOnLeft: props.state.userlistOnLeft,
            transparentChat: props.state.transparentChat,
            editMode: false,
            profileUpdateMode: false,
        }
    }

    //static getDerivedStateFromProps(props, state) {
    //    // This is suboptimal and can be avoided by having the props passed down as the correct value the first time around
    //    if (props.state.UserRoomSettings !== undefined && !state.editMode) {
    //        return {
    //            muteChatNotification: props.state.muteChatNotification,
    //            showUsernames: props.state.showUsernames,
    //            legacyDesign: props.legacyDesign,
    //            showIfMuted: props.state.showIfMuted,
    //            userlistOnLeft: props.state.userlistOnLeft,
    //            transparentChat: props.state.transparentChat,
    //            editMode: true
    //        };
    //    }
    //    return null;
    //}

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.state.UserRoomSettings != undefined || this.state.editMode || true
    }

    closeProfile = () => {
        this.props.updateRoomState({ UserRoomSettings: undefined })
        this.setState({ editMode: false })
    }

    saveProfile = () => {
        if (this.props.state.showIfMuted != this.state.showIfMuted)
            this.props.sendMessage({
                action: 'userMuted',
                muted: this.state.showMuted && (this.props.state.muted || this.props.state.videoPaused)
            });
        this.props.updateRoomState({
            muteChatNotification: this.state.muteChatNotification,
            showUsernames: this.state.showUsernames,
            showIfMuted: this.state.showIfMuted,
            userlistOnLeft: this.state.userlistOnLeft,
            transparentChat: this.state.transparentChat
        })
        this.props.setAppState({
            legacyDesign: this.state.legacyDesign
        })

        localStorage.setItem("muteChatNotification", this.state.muteChatNotification);
        localStorage.setItem("showUsernames", this.state.showUsernames);
        localStorage.setItem("legacyDesign", this.state.legacyDesign);
        localStorage.setItem("showIfMuted", this.state.showIfMuted);
        localStorage.setItem("userlistOnLeft", this.state.userlistOnLeft);
        localStorage.setItem("transparentChat", this.state.transparentChat);
        this.closeProfile()
    }

    onSubmit = e => {
        console.log("submitted!");
        e.preventDefault();
        this.saveProfile();
    }

    toggle = (e, name) => {
        let checked = this.state[name];
        if (checked === undefined) return;
        this.setState({ [name]: !checked })
    }


    profileUpdateCallback = () => {
        this.setState({profileUpdateMode: false});
        this.props.sendMessage({
            action: 'updateprofile'
        });
    }


    backgroundProfileUpdate = createRef();
    render({ state,profile }) {
        return <div class="modal-background">
            {!this.state.profileUpdateMode &&
            <form class="profile modal" onSubmit={this.onSubmit}>
                {profile.username && <Button onclick={() => this.setState({profileUpdateMode: true})}>Edit Profile</Button>}
                {!profile.username && <div>Please log in to edit your Nickname and Profile Picture</div>}
                <div class="userOptions">
                    <div class="usersubOptions">
                        <div><input class="modal-username" type="checkbox" id="muteChatNotification" onClick={e => this.toggle(e, 'muteChatNotification')}
                            name="muteChatNotification" checked={this.state.muteChatNotification} /> <label for="muteChatNotification">Mute Chat Notification</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="legacyDesign" onClick={e => this.toggle(e, 'legacyDesign')}
                            name="legacyDesign" checked={this.state.legacyDesign} /> <label for="legacyDesign">Use Legacy Design</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showIfMuted" onClick={e => this.toggle(e, 'showIfMuted')}
                            name="showIfMuted" checked={this.state.showIfMuted} /> <label for="showIfMuted">Show Others If Muted</label>
                        </div>
                    </div>
                    <div class="usersubOptions">
                        <div><input class="modal-username" type="checkbox" id="showUsernames" onClick={e => this.toggle(e, 'showUsernames')}
                            name="showUsernames" checked={this.state.showUsernames} /> <label for="showUsernames">Show Usernames</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="userlistOnLeft" onClick={e => this.toggle(e, 'userlistOnLeft')}
                            name="userlistOnLeft" checked={this.state.userlistOnLeft} /> <label for="userlistOnLeft">Show Users On Left</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="transparentChat" onClick={e => this.toggle(e, 'transparentChat')}
                            name="transparentChat" checked={this.state.transparentChat} /> <label for="transparentChat">Fullscreen Transparent Chat</label>
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary btnStandard" type="summit" >Save</button>
            </form>
            }
            {this.state.profileUpdateMode &&
            <div class="center-background" ref={this.backgroundProfileUpdate} onclick={(e) => {if(e.target == this.backgroundProfileUpdate.current) this.setState({profileUpdateMode: false})}}>
                <ProfileModal profile={this.props.profile} updateProfile={this.props.updateProfile} setAppState={this.props.setAppState} successCallback={this.profileUpdateCallback.bind(this)}/>
            </div>
            }
        </div>
    }
}
