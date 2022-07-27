import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState } from '/js/index.js'
import { sendMessage } from '/js/Room.js'


function openAvatarUpload() {
    document.getElementById('avatar-uploader').click();
}

function closeProfile() {
    updateState(function (state) {
        delete state.profileModal;
    })
}

function updateProfileUsername(username) {
    updateState(function (state) {
        state.profileModal.username = username;
    })
}

function updateProfileMuteChatNotification(muteChatNotification) {
    updateState(function (state) {
        state.profileModal.muteChatNotification = muteChatNotification;
    })
}

function updateShowUsernamesOnBottom(showUsername) {
    updateState(function (state) {
        state.profileModal.showUsernames = showUsername;
    })
}

function updateDesignChoice(useLegacy) {
    updateState(function (state) {
        state.profileModal.legacyDesign = useLegacy;
    })
}

function updateUserlistOnLeft(userlistOnLeft) {
    updateState(function (state) {
        state.profileModal.userlistOnLeft = userlistOnLeft;
    })
}

function updateShowIfMuted(showMuted) {
    updateState(function (state) {
        state.profileModal.showIfMuted = showMuted;
    })
    sendMessage({
        action : 'userMuted',
        muted: showMuted && (state.muted || state.videoPaused)
    });
}

function saveProfile() {
    updateState(function (state) {
        if(state.profileModal) {
            state.muteChatNotification = state.profileModal.muteChatNotification;
            state.showUsernames = state.profileModal.showUsernames;
            state.legacyDesign = state.profileModal.legacyDesign;
            state.showIfMuted = state.profileModal.showIfMuted;
            state.userlistOnLeft = state.profileModal.userlistOnLeft;
            if(state.username != state.profileModal.username.substring(0, 12)){
            state.username = state.profileModal.username.substring(0, 12);
            sendMessage({
                action : 'changeusername',
                username : state.username
            });
            }
            if(state.avatarUrl != state.profileModal.avatarUrl){
            state.avatarUrl = state.profileModal.avatarUrl;
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
    closeProfile()
}

function avatarSelected(e) {
    let formData = new FormData();
    formData.append("avatar", e.target.files[0]);
    fetch('/avatar/upload', {method: "POST", body: formData}).then((e) => e.json()).then(function (e) {
        updateState(function (state) {
            if(e.url) {
                state.profileModal.avatarUrl = e.url;
            }
        })
    });
}

export function openProfile() {
    updateState(function (state) {
        state.profileModal = {
            username: state.username,
            avatarUrl: state.avatarUrl,
            muteChatNotification: state.muteChatNotification,
            showUsernames: state.showUsernames,
            legacyDesign: state.legacyDesign,
            showIfMuted: state.showIfMuted,
            userlistOnLeft: state.userlistOnLeft
        };
    })
}

export class ProfileModal extends Component {
    render({ state }, { xyz = [] }) {
        return html`${state.profileModal && html`
            <div class="modal-background">
                <div class="profile modal">
                    <div class="title">
                        <div>
                            Profile
                        </div>
                        <button type="button" class="modal-close" onclick=${closeProfile}>X</button>
                    </div>
                    <div class="image avatar big" style="background-image: url('${state.profileModal.avatarUrl}');">
                        <div class="uploader-overlay" onclick=${openAvatarUpload}>
                            <input id="avatar-uploader" type="file" name="avatar" accept="image/png, image/jpeg, image/webp" onchange=${avatarSelected}/>
                            <div class="center">Upload</div>
                        </div>
                    </div>
                    <div>
                        Username
                    </div>
                    <input class="modal-username" type="text"
                        onInput=${e => updateProfileUsername(e.target.value)}
                        name="username" maxlength="12" value="${state.profileModal.username}"/>
                    <div class="userOptions">
                        <div><input class="modal-username" type="checkbox" id="muteChatNotification"
                            onInput=${e => updateProfileMuteChatNotification(e.target.checked)}
                            name="muteChatNotification" checked="${state.profileModal.muteChatNotification}"/> <label for="muteChatNotification">Mute Chat Notification</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showUsernames"
                            onInput=${e => updateShowUsernamesOnBottom(e.target.checked)}
                            name="showUsernames" checked="${state.profileModal.showUsernames}"/> <label for="showUsernames">Show Usernames</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="legacyDesign"
                            onInput=${e => updateDesignChoice(e.target.checked)}
                            name="legacyDesign" checked="${state.profileModal.legacyDesign}"/> <label for="legacyDesign">Use Legacy Design</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="showIfMuted"
                            onInput=${e => updateShowIfMuted(e.target.checked)}
                            name="showIfMuted" checked="${state.profileModal.showIfMuted}"/> <label for="showIfMuted">Show Others If Muted</label>
                        </div>
                        <div><input class="modal-username" type="checkbox" id="userlistOnLeft"
                            onInput=${e => updateUserlistOnLeft(e.target.checked)}
                            name="userlistOnLeft" checked="${state.profileModal.userlistOnLeft}"/> <label for="userlistOnLeft">Show Users On Left</label>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick=${saveProfile}>Save</button>
                </div>
        </div>`}`
    }
}
