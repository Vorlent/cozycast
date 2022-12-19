import { h, Component, createRef, Fragment } from 'preact'
import { authFetch } from './Authentication.js'
import { HexColorPicker } from "react-colorful";
import Cropper from 'cropperjs';

export class ProfileModal extends Component {
    regExp = new RegExp('#(?:[0-9a-fA-F]{3}){1,2}')

    constructor(props) {
        super(props);
        this.state = {
            nickname: this.props.profile.nickname,
            nameColor: this.props.profile.nameColor,
            validColor: this.props.profile.nameColor,
            profilePicture: this.props.profile.avatarUrl
        }
    }

    onSubmit = e => {
        e.preventDefault();
        if(this.state.profilePicture != this.props.profile.avatarUrl){
            this.uploadAvatar();
        }   
        else this.uploadProfileChanges();
    }

    uploadAvatar = () => {
        let formData = new FormData();
        formData.append("avatar", this.state.pictureBlob);
        authFetch('/avatar/upload', { method: "POST", body: formData }).then((e) => e.json()).then((e) => {
            if (e.url) {
                this.props.setAppState(state => { return { profile: { ...state.profile, avatarUrl: e.url } } });
                this.setState({profilePicture: e.url});
                this.uploadProfileChanges();
            }
        });
    }

    uploadProfileChanges = () => {
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
                this.props.updateProfile();
                if(this.props.successCallback){
                    this.props.successCallback();
                }
                alert("Profile edited!");
            } else e.json().then(e => alert(e.errors.join("\n")))
        });
    }

    cropper = null;

    componentWillUnmount(){
        this.removeCropper();
    }

    removeCropper = () => {
        if(this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }

    currentImage = createRef();
    avatarSelected = (e) => {
        if(!this.cropper) {
            this.cropper = new Cropper(this.currentImage.current, {zoomable: false,aspectRatio: 1 ,autoCropArea: 0.3});
        }
        this.setState({pictureSelect: true});
        this.cropper.replace(URL.createObjectURL(e.target.files[0]));
    }

    changeAvatar = () => {
        this.cropper.getCroppedCanvas().toBlob((blob) => {
            var croppedImage = URL.createObjectURL(blob);
            this.setState({profilePicture: croppedImage, pictureBlob: blob,  pictureSelect: false})
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
        return <Fragment><form class="profile-page-modal" onSubmit={this.onSubmit}>
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
                        <div class="image avatar big" style={{ 'background-image': `url(${this.state.profilePicture})` }}>
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
            <div class="imageModal" style={{'max-width': '80vw', position: "absolute", tabindex: "0", "z-index": "100", 
            display: this.state.pictureSelect ? "unset" : "none", background: "var(--cozyButton)", "border-radius": "0.1em",outline: "1em solid var(--cozyButton" }}>
                    <div class="screenshotBorder">
                        <img style={{display: "block", 'max-width': '100%'}} ref={this.currentImage}/>
                    </div>
                    <div class="confirmButton">
                        <button type="button" onclick={this.changeAvatar} class="btn btn-danger buttonBorder">Crop</button>
                        <button type="button" onclick={() => this.setState({pictureSelect: false})} class="btn buttonCancel buttonBorder">Close</button>
                    </div>
            </div>
            </Fragment>
    }
}