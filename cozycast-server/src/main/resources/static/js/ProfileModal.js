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

function saveProfile() {
    updateState(function (state) {
        if(state.profileModal) {
            state.muteChatNotification = state.profileModal.muteChatNotification;
            state.username = state.profileModal.username.substring(0, 12)
            state.avatarUrl = state.profileModal.avatarUrl
            state.showUsernames = state.profileModal.showUsernames
            sendMessage({
                action : 'changeusername',
                username : state.username
            });
            sendMessage({
                action : 'changeprofilepicture',
                url : state.avatarUrl
            });
            localStorage.setItem("username", state.username);
            localStorage.setItem("avatarUrl", state.avatarUrl);
            localStorage.setItem("muteChatNotification", state.muteChatNotification);
            localStorage.setItem("showUsernames", state.showUsernames);
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
            showUsernames: state.showUsernames
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
                    <div>Mute Chat Notification: <input class="modal-username" type="checkbox"
                        onInput=${e => updateProfileMuteChatNotification(e.target.checked)}
                        name="muteChatNotification" checked="${state.profileModal.muteChatNotification}"/></div>
                    <div>Show Usernames: <input class="modal-username" type="checkbox"
                        onInput=${e => updateShowUsernamesOnBottom(e.target.checked)}
                        name="showUsernames" checked="${state.profileModal.showUsernames}"/></div>
                    <button class="btn btn-primary" onclick=${saveProfile}>Save</button>
                </div>
        </div>`}`
    }
}
