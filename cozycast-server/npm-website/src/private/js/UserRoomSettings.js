import { Fragment, h } from 'preact'
import { ProfileModal } from './ProfileModal';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext';
import { WebSocketContext } from './websocket/WebSocketContext';

export const UserRoomSettings = ({ close }) => {

    const { sendMessage, authorization, videoPaused } = useContext(WebSocketContext);
    const { loggedIn, userSettings, updateDesign, design, muted } = useContext(AppStateContext);
    const [settings, setSettings] = useState({});
    const [openTabs, setOpenTabs] = useState({});
    const [designTemp, setDesignTemp] = useState(null);
    const [profileMode, setProfileMode] = useState({open: false});
    const backgroundProfileUpdate = useRef();
    const backgroundSettings = useRef();

    useEffect(() => {
        setSettings({...userSettings.value});
        setDesignTemp(design.value)
     }, [])

    const sendWorkerRestart = () => {
        sendMessage({
            action: 'worker_restart'
        });
    }

    const saveProfile = () => {
        if (settings.showIfMuted != userSettings.value.showIfMuted)
            sendMessage({
                action: 'userMuted',
                muted: settings.showIfMuted && (muted.value || videoPaused.value)
            });
        userSettings.value = {...settings};
        updateDesign.value = designTemp;
        localStorage.setItem("userSettings", JSON.stringify(settings))
    }

    const closeProfile = () => {
        if(close) close();
    }

    const onSubmit = e => {
        e.preventDefault();
        saveProfile();
    }

    const toggleTabs = (e) => {
        setOpenTabs(oldTabs => ({ ...oldTabs, [e.target.name]: !oldTabs[e.target.name]}))
    }
    const toggle = (e) => {
        setSettings(settings => ({...settings, [e.target.name]: e.target.checked }));
    }

    const selectDesignChoice = (e) => {
        setDesignTemp(e.target.value);
    }


    const profileUpdateCallback = () => {
        setProfileMode({open: false});
        sendMessage({
            action: 'updateprofile'
        });
    }

    const closeProfileCall = () =>{
        setProfileMode({open: false});
    }

    const confirmRestart = () => {
        if (confirm("Are you sure you want to restart the VM?\n\nPlease only restart the VM if there are technical issues. Keep in mind that restarting the VM will put this command on a 1 hour cooldown for all users.")) {
            sendWorkerRestart();
        }
    }

    return (
        <div class="modal-background" ref={backgroundSettings} onmousedown={(e) => { if (e.target == backgroundSettings.current) {closeProfile()} }}>
            {!profileMode.open &&
                <form class="profile modal" onSubmit={onSubmit}>
                    <div class="roomSettingsHeaders">SETTINGS</div>
                    <div class="settingsContainer">

                        {loggedIn.value ?
                            <button onclick={() => {setProfileMode({open: true})}}>Edit Profile</button> :
                            <Fragment>
                                <button
                                    type="button"
                                    name="profile"
                                    onclick={toggleTabs}
                                    class={openTabs.profile ? "open" : ""}>Edit Profile</button>
                                {openTabs.profile &&
                                    <div class="subSettings">
                                        Please log in to edit your profile. <a href='/login' style={{ color: "var(--cozyOrange)" }}>Login</a>
                                    </div>}
                            </Fragment>
                        }

                        <button
                            type="button"
                            name="notification"
                            onClick={toggleTabs}
                            class={openTabs.notification ? "open" : ""}>Notification</button>
                        {openTabs.notification &&
                            <div class="subSettings">
                                <div><input
                                    class="modal-username"
                                    type="checkbox"
                                    id="muteChatNotification"
                                    onClick={toggle}
                                    name="muteChatNotification"
                                    checked={settings.muteChatNotification} />
                                    <label for="muteChatNotification">Mute Chat Notification</label>
                                </div>
                                <div><input
                                    class="modal-username"
                                    type="checkbox"
                                    id="showIfMuted"
                                    onClick={toggle}
                                    name="showIfMuted"
                                    checked={settings.showIfMuted} />
                                    <label for="showIfMuted">Show Others If Muted</label>
                                </div>
                                <div><input
                                    class="modal-username"
                                    type="checkbox"
                                    id="showLeaveJoinMsg"
                                    onClick={toggle}
                                    name="showLeaveJoinMsg"
                                    checked={settings.showLeaveJoinMsg} />
                                    <label for="showLeaveJoinMsg">Show Leave/Join Message</label>
                                </div>
                            </div>}

                        <button
                            type="button"
                            name="userlist"
                            onClick={toggleTabs}
                            class={openTabs.userlist ? "open" : ""}>Userlist</button>
                        {openTabs.userlist &&
                            <div class="subSettings">
                                <div><input
                                    class="modal-username"
                                    type="checkbox"
                                    id="userlistOnLeft"
                                    onClick={toggle}
                                    name="userlistOnLeft"
                                    checked={settings.userlistOnLeft} />
                                    <label for="userlistOnLeft">Show Users On Left</label>
                                </div>
                                <div><input
                                    class="modal-username"
                                    type="checkbox"
                                    id="showUsernames"
                                    onClick={toggle}
                                    name="showUsernames"
                                    checked={settings.showUsernames} />
                                    <label for="showUsernames">Show Usernames</label>
                                </div>
                                <div><input
                                    class="modal-username"
                                    type="checkbox"
                                    id="smallPfp"
                                    onClick={toggle}
                                    name="smallPfp"
                                    checked={settings.smallPfp} />
                                    <label for="smallPfp">Use Small Profile Pictures</label>
                                </div>
                            </div>}

                        <button
                            type="button"
                            name="design"
                            onClick={toggleTabs}
                            class={openTabs.design ? "open" : ""}>Design</button>
                        {openTabs.design &&
                            <div class="subSettings">
                                <div><input
                                    class="modal-username"
                                    type="checkbox"
                                    id="transparentChat"
                                    onClick={toggle}
                                    name="transparentChat"
                                    checked={settings.transparentChat} />
                                    <label for="transparentChat">Fullscreen Transparent Chat</label>
                                </div>
                                <div>
                                    <input
                                        class="modal-username"
                                        type="checkbox"
                                        style={{ visibility: "hidden" }} />
                                    <label for="design">Theme</label>
                                    <select
                                        id="design"
                                        name="design"
                                        style={{ 'margin-left': "1em" }}
                                        value={designTemp}
                                        onChange={selectDesignChoice}>
                                        <option value="defaultDesign">Default</option>
                                        <option value="legacyDesign">Legacy</option>
                                        <option value="lightDesign">Light</option>
                                    </select>
                                </div>
                            </div>}
                        {authorization.value.trusted && <button onclick={confirmRestart}>Restart VM</button>}
                    </div>
                    <div class="confirmButton">
                        <button class="btn btn-danger btnStandard" type="submit">Apply</button>
                        <button class="btn btn-primary btnStandard" type="button" onclick={closeProfile}>Close</button>
                    </div>
                </form>
            }
            {profileMode.open &&
                <div class="center-background" ref={backgroundProfileUpdate} onmousedown={(e) => {if(e.target == backgroundProfileUpdate.current){ closeProfileCall()} }}>
                    <ProfileModal successCallback={profileUpdateCallback} />
                </div>
            }
        </div>
    )
}
