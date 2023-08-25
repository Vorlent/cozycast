import { h, Fragment } from 'preact'
import { authFetch } from './Authentication.js'
import { HexColorPicker } from "react-colorful";
import Cropper from 'cropperjs';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext.js';

export const ProfileModal = ({ successCallback }) => {
    const regExp = useRef(new RegExp('#(?:[0-9a-fA-F]{3}){1,2}'));
    const cropper = useRef(null);
    const { profile } = useContext(AppStateContext);

    const [state, setState] = useState({});

    useEffect(() => {
        setState({
            nickname: profile.value.nickname,
            nameColor: profile.value.nameColor,
            validColor: profile.value.nameColor,
            profilePicture: profile.value.avatarUrl
        })

        return () => {
            removeCropper();
        }
    }, [])

    const onSubmit = e => {
        e.preventDefault();
        if (state.profilePicture != profile.value.avatarUrl) {
            uploadAvatar();
        }
        else uploadProfileChanges();
    }

    const uploadAvatar = () => {
        let formData = new FormData();
        formData.append("avatar", state.pictureBlob);
        authFetch('/avatar/upload', { method: "POST", body: formData }).then((e) => e.json()).then((e) => {
            if (e.url) {
                profile.value = { ...profile.value, avatarUrl: e.url };
                setState(state => ({ ...state, profilePicture: e.url }))
                uploadProfileChanges();
            }
        });
    }

    const uploadProfileChanges = () => {
        authFetch('/api/profile', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nickname: state.nickname,
                nameColor: state.nameColor
            })
        }).then((e) => {
            if (e.status == 200) {
                profile.value = {
                    ...profile.value,
                    nickname: state.nickname,
                    nameColor: state.nameColor,
                    pingName: state.nickname.replace(/\s/g, '').toLowerCase()
                }
                if (successCallback) {
                    successCallback();
                }
                alert("Profile edited!");
            } else e.json().then(e => alert(e.errors.join("\n")))
        });
    }

    const removeCropper = () => {
        if (cropper.current) {
            cropper.current.destroy();
            cropper.current = null;
        }
    }

    const currentImage = useRef();
    const avatarSelected = (e) => {
        if (!cropper.current) {
            cropper.current = new Cropper(currentImage.current, { zoomable: false, aspectRatio: 1, autoCropArea: 0.3 });
        }
        setState(state => ({ ...state, pictureSelect: true }));
        cropper.current.replace(URL.createObjectURL(e.target.files[0]));
        e.target.value = '';
    }

    const changeAvatar = () => {
        cropper.current.getCroppedCanvas().toBlob((blob) => {
            var croppedImage = URL.createObjectURL(blob);
            setState(state => ({ ...state, profilePicture: croppedImage, pictureBlob: blob, pictureSelect: false }));
        });
    }

    const onInput = e => {
        setState((state) => ({ ...state, nickname: e }))
    }

    const onInputColor = e => {
        if (regExp.current.test(e)) {
            setState(state => ({ ...state, nameColor: e, validColor: e }))
        }
    }

    return (
        <Fragment>
            <form class="profile-page-modal" onSubmit={onSubmit}>
                <div class="profileTitle landscapeOptional">
                    Profile
                </div>
                <div class="profileDataEdit">
                    <div class="profileUpperData">
                        <div class="profileDataContainer">
                            <div class="profileTextInfoContainer">
                                <div class="profileTextContainer">
                                    <div class="profileTextInfo">Username</div>
                                    <div class="profileTextData">{profile.value.username}</div>
                                </div>
                                <div class="profileTextContainer">
                                    <div class="profileTextInfo">Nickname</div>
                                    <div class="profileTextData">{state.nickname}</div>
                                </div>
                            </div>
                            <div class="profileAvatarContainer">
                                <div class="image avatar big" style={{ 'background-image': `url(${state.profilePicture})` }}>
                                    <div class="uploader-overlay" onclick={() => document.getElementById('avatar-uploader').click()}>
                                        <input id="avatar-uploader" type="file" name="avatar" accept="image/png, image/jpeg, image/webp" onchange={avatarSelected} />
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
                                onInput={e => onInput(e.target.value)}
                                name="username" maxlength="12" value={state.nickname} />
                        </div>
                    </div>
                    <div style={{ display: "flex" }}>
                        <div class="profileHexColorContainer">
                            <HexColorPicker color={state.validColor} onChange={onInputColor} />
                        </div>
                        <div>
                            <div class="chatMessagePreviewContainer legacyDesign optional">
                                <div style={{ width: "15em", height: "max-content" }}>
                                    <div class="message">
                                        <div class="username" style={{ color: state.validColor }}>{state.nickname}<span class="timestamp">{"   8:00 AM"}</span>
                                        </div>
                                        <div class="subMessage">
                                            <span class="chat-text">This is how it will look with the legacy theme<br /></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="chatMessagePreviewContainer defaultDesign optional">
                                <div style={{ width: "15em", height: "max-content" }}>
                                    <div class="message">
                                        <div class="username" style={{ color: state.validColor }}>{state.nickname}<span class="timestamp">{"   8:00 AM"}</span>
                                        </div>
                                        <div class="subMessage">
                                            <span class="chat-text">This is how it will look with the default theme<br /></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary btnStandard" type="summit" >Save</button>
            </form>
            <div class="imageModal" style={{
                'max-width': '80vw', position: "absolute", tabindex: "0", "z-index": "100",
                display: state.pictureSelect ? "unset" : "none", background: "var(--cozyButton)", "border-radius": "0.1em", outline: "1em solid var(--cozyButton"
            }}>
                <div class="screenshotBorder">
                    <img style={{ display: "block", 'max-width': '100%' }} ref={currentImage} />
                </div>
                <div class="confirmButton">
                    <button type="button" onclick={changeAvatar} class="btn btn-danger buttonBorder">Crop</button>
                    <button type="button" onclick={() => setState(state => ({ ...state, pictureSelect: false }))} class="btn buttonCancel buttonBorder">Close</button>
                </div>
            </div>
        </Fragment>
    )
}