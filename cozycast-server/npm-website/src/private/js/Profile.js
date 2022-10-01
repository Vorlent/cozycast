import { Component, h } from 'preact'
import { authFetch } from './Authentication.js'
import { HexColorPicker } from "react-colorful";

export class Profile extends Component {
    regExp = new RegExp('#(?:[0-9a-fA-F]{3}){1,2}')

    constructor(props) {
        super(props);
        this.state = {
            nickname: this.props.profile.nickname,
            nameColor: this.props.profile.nameColor,
            validColor: this.props.profile.nameColor
        }
    }

    onSubmit = e => {
        e.preventDefault();
        console.log("submitted")
        authFetch('/api/profile', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nickname: this.state.nickname,
                nameColor: this.state.nameColor
            })
        }).then((e) => {
            if (e.status == 200) {
                alert("Profile edited!");
                this.props.updateProfile()
            } else e.json().then(e => alert(e.errors.join("\n")))
        });
    }

    avatarSelected = (e) => {
        let formData = new FormData();
        formData.append("avatar", e.target.files[0]);
        authFetch('/avatar/upload', { method: "POST", body: formData }).then((e) => e.json()).then((e) => {
            if (e.url) {
                this.props.setAppState(state => { return { profile: { ...state.profile, avatarUrl: e.url } } })
            }
        });
    }

    onInput = e => {
        this.setState({ nickname: e })
    }

    onInputColor = e => {
        this.setState(state => {
            if (this.regExp.test(e)) return { nameColor: e, validColor: e }
            return { nameColor: e }
        }
        )
    }

    render({ profile }) {
        return <div class="admin-background">
            <form class="profile-page-modal" onSubmit={this.onSubmit}>
                <div class="profileTitle">
                    Profile
                </div>
                <div class="profileDataContainer">
                    <div class="profileTextInfoContainer">
                        <div class="profileTextContainer">
                            <div class="profileTextInfo">Username</div>
                            <div class="profileTextData">{profile.username}</div>
                        </div>
                        <div class="profileTextContainer">
                            <div class="profileTextInfo">Nickname</div>
                            <div class="profileTextData">{profile.nickname}</div>
                        </div>
                    </div>
                    <div class="profileAvatarContainer">
                        <div class="image avatar big" style={{ 'background-image': `url(${profile.avatarUrl})` }}>
                            <div class="uploader-overlay" onclick={() => document.getElementById('avatar-uploader').click()}>
                                <input id="avatar-uploader" type="file" name="avatar" accept="image/png, image/jpeg, image/webp" onchange={this.avatarSelected} />
                                <div class="center">Upload</div>
                            </div>
                        </div>
                    </div>
                </div>
                <br /><br />
                <div class="profileNicknameContainer">
                    <div>
                        Edit Nickname
                    </div>
                    <input class="modal-username standardInputField" type="text"
                        onInput={e => this.onInput(e.target.value)}
                        name="username" maxlength="12" value={this.state.nickname} />
                </div>
                <div style={{ display: "flex" }}>
                    <div class="profileHexColorContainer">
                        <HexColorPicker color={this.state.validColor} onChange={this.onInputColor} />
                    </div>
                    <div>
                        <div style={{ background: "#171b22" }} class="chatMessagePreviewContainer">
                            <div style={{ width: "15em", height: "max-content" }}>
                                <div class="message">
                                    <div class="username" style={{ color: this.state.validColor }}>{this.state.nickname}<span class="timestamp">{"   8:00 AM"}</span>
                                    </div>
                                    <div class="subMessage">
                                        <span class="chat-text">This is how it will look with the legacy theme<br /></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ background: "#123 var(--cozycast-noise)" }} class="chatMessagePreviewContainer">
                            <div style={{ width: "15em", height: "max-content" }}>
                                <div class="message">
                                    <div class="username" style={{ color: this.state.validColor }}>{this.state.nickname}<span class="timestamp">{"   8:00 AM"}</span>
                                    </div>
                                    <div class="subMessage">
                                        <span class="chat-text">This is how it will look with the default theme<br /></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary btnStandard" type="summit" >Save</button>
            </form>
        </div>
    }
}