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
            design: props.design,
            showIfMuted: props.state.showIfMuted,
            userlistOnLeft: props.state.userlistOnLeft,
            transparentChat: props.state.transparentChat,
            smallPfp: props.state.smallPfp,
            editMode: false,
            profileUpdateMode: false,
            openSettings: {
                profile: false,
                userlist: false,
                notification: false,
                design: false
            }
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.state.UserRoomSettings != undefined || this.state.editMode || true
    }

    closeProfile = () => {
        this.props.updateRoomState({ UserRoomSettings: undefined })
        this.setState({ editMode: false })
    }

    sendWorkerRestart = () => {
        this.props.sendMessage({
            action: 'worker_restart'
        });
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
            transparentChat: this.state.transparentChat,
            smallPfp: this.state.smallPfp,
        })
        this.props.updateDesign(this.state.design);
        localStorage.setItem("muteChatNotification", this.state.muteChatNotification);
        localStorage.setItem("showUsernames", this.state.showUsernames);
        localStorage.setItem("showIfMuted", this.state.showIfMuted);
        localStorage.setItem("userlistOnLeft", this.state.userlistOnLeft);
        localStorage.setItem("transparentChat", this.state.transparentChat);
        localStorage.setItem("smallPfp", this.state.smallPfp);
    }

    onSubmit = e => {
        e.preventDefault();
        if(this.props.design == 'lightDesign' && this.state.design != 'lightDesign'){
            if(confirm("You are about to disable light theme.\nAre you sure you want to do that?")){
                if(confirm("To confirm your action please press cancel.")){
                }
                else this.saveProfile();
            }
        }
        else this.saveProfile();
        //this.closeProfile();
    }

    toggle = (e, name) => {
        let checked = this.state[name];
        if (checked === undefined) return;
        this.setState({ [name]: !checked })
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

                    <div onclick={() => this.setState(state => {return {openSettings: {...state.openSettings, notification: !state.openSettings.notification}}})} class={`settingsMenu ${state.openSettings.notification ? "open" : ""}`}>Notification & Display</div>
                    {state.openSettings.notification && 
                    <div class = "subSettings">
                        <div><input class="modal-username" type="checkbox" id="muteChatNotification" onClick={e => this.toggle(e, 'muteChatNotification')}
                            name="muteChatNotification" checked={this.state.muteChatNotification} /> <label for="muteChatNotification">Mute Chat Notification</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showIfMuted" onClick={e => this.toggle(e, 'showIfMuted')}
                                name="showIfMuted" checked={this.state.showIfMuted} /> <label for="showIfMuted">Show Others If Muted</label>
                        </div>
                    </div> }

                    <div onclick={() => this.setState(state => {return {openSettings: {...state.openSettings, userlist: !state.openSettings.userlist}}})} class={`settingsMenu ${state.openSettings.userlist ? "open" : ""}`}>Userlist</div>
                    {state.openSettings.userlist && 
                    <div class = "subSettings">
                        <div><input class="modal-username" type="checkbox" id="userlistOnLeft" onClick={e => this.toggle(e, 'userlistOnLeft')}
                            name="userlistOnLeft" checked={this.state.userlistOnLeft} /> <label for="userlistOnLeft">Show Users On Left</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showUsernames" onClick={e => this.toggle(e, 'showUsernames')}
                            name="showUsernames" checked={this.state.showUsernames} /> <label for="showUsernames">Show Usernames</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="smallPfp" onClick={e => this.toggle(e, 'smallPfp')}
                                name="smallPfp" checked={this.state.smallPfp} /> <label for="smallPfp">Use Small Profile Pictures</label>
                        </div>
                    </div> }

                    <div onclick={() => this.setState(state => {return {openSettings: {...state.openSettings, design: !state.openSettings.design}}})} class={`settingsMenu ${state.openSettings.design ? "open" : ""}`}>Design</div>
                    {state.openSettings.design && 
                    <div class = "subSettings">
                            <div>
                                <input class="modal-username" type="checkbox" style={{visibility: "hidden"}}/> <label for="design">Design</label>
                                <select id="design" name="design" style={{'margin-left': "1em"}}
                                    value={this.state.design}
                                    onChange={this.selectDesignChoice}>
                                    <option value="defaultDesign">Default</option>
                                    <option value="legacyDesign">Legacy</option>
                                    <option value="lightDesign">Light</option>
                                </select>
                            </div>
                            <div><input class="modal-username" type="checkbox" id="transparentChat" onClick={e => this.toggle(e, 'transparentChat')}
                                name="transparentChat" checked={this.state.transparentChat} /> <label for="transparentChat">Fullscreen Transparent Chat</label>
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
