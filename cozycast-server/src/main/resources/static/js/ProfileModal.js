import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState, sendMessage } from '/js/index.js'


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

function saveProfile() {
    updateState(function (state) {
        if(state.profileModal) {
            state.muteChatNotification = state.profileModal.muteChatNotification;
            state.username = state.profileModal.username.substring(0, 12)
            state.avatarUrl = state.profileModal.avatarUrl
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
        }
    })
    closeProfile()
}

function avatarSelected(e) {
    let formData = new FormData();
    formData.append("avatar", e.target.files[0]);
    fetch('/avatar/upload', {method: "POST", body: formData}).then((e) => e.json()).then(function (e) {
        updateState(function (state) {
            state.profileModal.avatarUrl = e.url;
        })
    });
}

export function openProfile() {
    updateState(function (state) {
        state.profileModal = {
            username: state.username,
            avatarUrl: state.avatarUrl,
            muteChatNotification: state.muteChatNotification
        };
    })
}

export class ProfileModal extends Component {
    render({ state }, { xyz = [] }) {
        return html`${state.profileModal && html`
            <div id="profile-modal-background">
                <div id="profile-modal">
                    <div class="title">
                        <div>
                            Profile
                        </div>
                        <button type="button" id="profile-modal-close" onclick=${closeProfile}>X</button>
                    </div>
                    <div class="image avatar big" style="background-image: url('${state.profileModal.avatarUrl}');">
                        <div class="uploader-overlay" onclick=${openAvatarUpload}>
                            <input id="avatar-uploader" type="file" name="avatar" accept="image/png, image/jpeg, image/gif" onchange=${avatarSelected}/>
                            <div class="center">Upload</div>
                        </div>
                    </div>
                    <div>
                        Username
                    </div>
                    <input class="profile-modal-username" type="text"
                        onInput=${e => updateProfileUsername(e.target.value)}
                        name="username" maxlength="12" value="${state.profileModal.username}"/>
                    <div>Mute Chat Notification: <input class="profile-modal-username" type="checkbox"
                        onInput=${e => updateProfileMuteChatNotification(e.target.checked)}
                        name="muteChatNotification" checked="${state.profileModal.muteChatNotification}"/></div>
                    <button class="btn btn-primary" onclick=${saveProfile}>Save</button>
                </div>
        </div>`}`
    }
}
