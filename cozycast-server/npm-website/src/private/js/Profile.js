import { Component, h } from 'preact'
import { authFetch} from './Authentication.js'
import e from './libs/favico-0.3.10.min.js';

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
        }).then(e => console.log(e))
    }

    avatarSelected = (e) => {
        let formData = new FormData();
        formData.append("avatar", e.target.files[0]);
        authFetch('/avatar/upload', {method: "POST", body: formData}).then((e) => e.json()).then((e) => {
            if(e.url) {
                this.props.setAppState(state => {return {profile: {...state.profile,avatarUrl: e.url }}})
            }
        });
    }

    onInput = e => {
        this.setState({ nickname: e })
    }
    onInputColor = e => {
        this.setState(state =>
            {if (this.regExp.test(e)) return{ nameColor: e, validColor: e}
            return { nameColor: e}
            }
            )
    }

    render({profile}) {
        return <div class="admin-background">
                <form class="profile-page-modal" onSubmit={this.onSubmit}>
                    <div class="title">
                        <div>
                            Username: {profile.username}
                        </div>
                    </div>
                    <div class="image avatar big" style={{'background-image': `url(${profile.avatarUrl})`}}>
                        <div class="uploader-overlay" onclick={() => document.getElementById('avatar-uploader').click()}>
                            <input id="avatar-uploader" type="file" name="avatar" accept="image/png, image/jpeg, image/webp" onchange={this.avatarSelected}/>
                            <div class="center">Upload</div>
                        </div>
                    </div>
                    <br/><br/>
                    <div>
                        Nickname
                    </div>
                    <input class="modal-username" type="text"
                        onInput={e => this.onInput(e.target.value)}
                        name="username" maxlength="12" value={this.state.nickname}/>
                    <div style={{color: this.state.validColor}}>
                        Name Color <span style={{width: "1em",background: this.state.validColor,display: "inline-block",height: "0.7em",margin: "auto"}}></span>
                    </div>
                    <input class="modal-username" type="text"
                        onInput={e => this.onInputColor(e.target.value)}
                        name="username" maxlength="7" value={this.state.nameColor}/>
                    <button class="btn btn-primary" type="summit" >Save</button>
                </form>
        </div>
    }
}