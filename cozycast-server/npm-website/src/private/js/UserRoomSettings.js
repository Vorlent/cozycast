import { Component, Fragment, h, createRef } from 'preact'
import { ProfileModal } from './ProfileModal';

export class UserRoomSettings extends Component {
    constructor(props) {
        super(props);
        //since UserRoomSettings is the only component changing these states it's okay to intitalize it like this
        this.state = {
            userSettings: {...props.userSettings},
            design: props.design,
            profileUpdateMode: false,
            openSettings: {
                profile: false,
                userlist: false,
                notification: false,
                design: false
            }
        }
    }

    closeProfile = () => {
        this.props.updateRoomState({ UserRoomSettings: undefined })
    }

    sendWorkerRestart = () => {
        this.props.sendMessage({
            action: 'worker_restart'
        });
    }

    saveProfile = () => {
        if (this.props.userSettings.showIfMuted != this.state.userSettings.showIfMuted)
            this.props.sendMessage({
                action: 'userMuted',
                muted: this.state.userSettings.showIfMuted && (this.props.state.muted || this.props.state.videoPaused)
            });
        this.props.updateRoomState(state => {return {userSettings: { ...state.userSettings,
            ...this.state.userSettings}}
        })
        this.props.updateDesign(this.state.design);
        localStorage.setItem("userSettings",JSON.stringify(this.state.userSettings))
    }

    onSubmit = e => {
        e.preventDefault();
        this.saveProfile();
        //this.closeProfile();
    }

    toggle = (e, name) => {
        let checked = this.state.userSettings[name];
        //if (checked === undefined) return;
        this.setState(state => { return {userSettings: {...state.userSettings, [name]: !checked }}})
    }

    selectDesignChoice = (e) => {
        this.setState({design: e.target.value});
    }


    profileUpdateCallback = () => {
        this.setState({profileUpdateMode: false});
        this.props.sendMessage({
            action: 'updateprofile'
        });
    }

    confirmRestart = () => {
        if(confirm("Are you sure you want to restart the VM?\n\nPlease only restart the VM if there are technical issues. Keep in mind that restarting the VM will put this command on a 1 hour cooldown for all users.")){
            this.sendWorkerRestart();
        }
    }


    backgroundProfileUpdate = createRef();
    backgroundSettings = createRef();
    render({profile },state) {
        return <div class="modal-background" ref={this.backgroundSettings} onmousedown={(e) => {if(e.target == this.backgroundSettings.current) this.closeProfile()}}>
            {!this.state.profileUpdateMode &&
            <form class="profile modal" onSubmit={this.onSubmit}>
                <div class="roomSettingsHeaders">SETTINGS</div>
                <div class="settingsContainer">

                    {profile.username ? <div onclick={() => this.setState({profileUpdateMode: true})} class={`settingsMenu`}>Edit Profile</div> : 
                        <Fragment>
                        <div onclick={() => this.setState(state => {return {openSettings: {...state.openSettings, profile: !state.openSettings.profile}}})} class={`settingsMenu ${state.openSettings.profile ? "open" : ""}`}>Edit Profile</div>
                            {state.openSettings.profile && 
                            <div class = "subSettings">
                                Please log in to edit your profile. <a href='/login' style={{color: "var(--cozyOrange)"}}>Login</a>
                            </div> }
                        </Fragment>
                    }

                    <div onclick={() => this.setState(state => {return {openSettings: {...state.openSettings, notification: !state.openSettings.notification}}})} class={`settingsMenu ${state.openSettings.notification ? "open" : ""}`}>Notification</div>
                    {state.openSettings.notification && 
                    <div class = "subSettings">
                        <div><input class="modal-username" type="checkbox" id="muteChatNotification" onClick={e => this.toggle(e, 'muteChatNotification')}
                            name="muteChatNotification" checked={this.state.userSettings.muteChatNotification} /> <label for="muteChatNotification">Mute Chat Notification</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showIfMuted" onClick={e => this.toggle(e, 'showIfMuted')}
                                name="showIfMuted" checked={this.state.userSettings.showIfMuted} /> <label for="showIfMuted">Show Others If Muted</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showLeaveJoinMsg" onClick={e => this.toggle(e, 'showLeaveJoinMsg')}
                                name="showLeaveJoinMsg" checked={this.state.userSettings.showLeaveJoinMsg} /> <label for="showLeaveJoinMsg">Show Leave/Join Message</label>
                        </div>
                    </div> }

                    <div onclick={() => this.setState(state => {return {openSettings: {...state.openSettings, userlist: !state.openSettings.userlist}}})} class={`settingsMenu ${state.openSettings.userlist ? "open" : ""}`}>Userlist</div>
                    {state.openSettings.userlist && 
                    <div class = "subSettings">
                        <div><input class="modal-username" type="checkbox" id="userlistOnLeft" onClick={e => this.toggle(e, 'userlistOnLeft')}
                            name="userlistOnLeft" checked={this.state.userSettings.userlistOnLeft} /> <label for="userlistOnLeft">Show Users On Left</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showUsernames" onClick={e => this.toggle(e, 'showUsernames')}
                            name="showUsernames" checked={this.state.userSettings.showUsernames} /> <label for="showUsernames">Show Usernames</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="smallPfp" onClick={e => this.toggle(e, 'smallPfp')}
                                name="smallPfp" checked={this.state.userSettings.smallPfp} /> <label for="smallPfp">Use Small Profile Pictures</label>
                        </div>
                    </div> }

                    <div onclick={() => this.setState(state => {return {openSettings: {...state.openSettings, design: !state.openSettings.design}}})} class={`settingsMenu ${state.openSettings.design ? "open" : ""}`}>Design</div>
                    {state.openSettings.design && 
                    <div class = "subSettings">
                            <div><input class="modal-username" type="checkbox" id="transparentChat" onClick={e => this.toggle(e, 'transparentChat')}
                                name="transparentChat" checked={this.state.userSettings.transparentChat} /> <label for="transparentChat">Fullscreen Transparent Chat</label>
                            </div>
                            <div>
                                <input class="modal-username" type="checkbox" style={{visibility: "hidden"}}/> <label for="design">Theme</label>
                                <select id="design" name="design" style={{'margin-left': "1em"}}
                                    value={this.state.design}
                                    onChange={this.selectDesignChoice}>
                                    <option value="defaultDesign">Default</option>
                                    <option value="legacyDesign">Legacy</option>
                                    <option value="lightDesign">Light</option>
                                </select>
                            </div>
                    </div> }
                    {profile.verified && <div class="settingsMenu" onclick={this.confirmRestart}>Restart VM</div>}
                </div>
                <div class="confirmButton">
                    <button class="btn btn-danger btnStandard" type="submit">Apply</button>
                    <button class="btn btn-primary btnStandard" type="button" onclick={this.closeProfile}>Close</button>
                </div>
            </form>
            }
            {this.state.profileUpdateMode &&
            <div class="center-background" ref={this.backgroundProfileUpdate} onmousedown={(e) => {if(e.target == this.backgroundProfileUpdate.current) this.setState({profileUpdateMode: false})}}>
                <ProfileModal profile={this.props.profile} updateProfile={this.props.updateProfile} setAppState={this.props.setAppState} successCallback={this.profileUpdateCallback.bind(this)}/>
            </div>
            }
        </div>
    }
}
