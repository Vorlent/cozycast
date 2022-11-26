import { h, Component, Fragment } from 'preact'
import { authLogin, logOut } from './Authentication';
import { Header } from './Header.js';
import { route } from 'preact-router'

export class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: "",
            confirmPassword: "",
            registered: false
        }
    }

    onSubmit = e => {
        e.preventDefault();
        this.register();
    }

    register = () => {
        if(this.state.password != this.state.confirmPassword){
            alert("Passwords do not match");
            return;
        }
        fetch("/register", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: this.state.username,
                password: this.state.password,
                inviteCode: this.props.inviteCode
            })
        }).then((e) => {
            if (e.status == 200) {
                this.setState({ 
                    registered: true,
                    username: "",
                    password: "",
                    confirmPassword: ""
                });
                this.props.setAppState(state => { return { inviteCode: undefined } })
            } else e.json().then(e => alert(e.errors.join("\n")))
        });
    }

    updateUsername = (value) => {
        this.setState({ username: value });
    }

    updatePassword = (value) => {
        this.setState({ password: value });
    }

    updateConfirmPassword = (value) => {
        this.setState({ confirmPassword: value });
    }

    render(_, state) {
        return <div class="admin-background">
            <div class="admin">
                <div class="admin-modal">
                    {!state.registered &&
                        <form class="formStandard" onSubmit={this.onSubmit} id="registerForm" autocomplete="off" >
                            <div class="admin-title">
                                Register
                            </div>
                            <div>
                                <label for="usernameInputRegister">
                                    Username
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="text" id="usernameInputRegister"
                                        onInput={e => this.updateUsername(e.target.value)}
                                        name="usernameRegister" maxlength="12" value={state.username} autocomplete="off" />
                                </div>
                            </div>
                            <div>
                                <label for="passwordInputRegister">
                                    Password
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="password" id="passwordInputRegister"
                                        onInput={e => this.updatePassword(e.target.value)}
                                        name="passwordRegister" maxlength="64" value={state.password} autocomplete="off" />
                                </div>
                            </div>
                            <div>
                                <label for="passwordInputConfirm">
                                    Confirm Password
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="password" id="passwordInputConfirm"
                                        onInput={e => this.updateConfirmPassword(e.target.value)}
                                        name="confirmPassword" maxlength="64" value={state.confirmPassword} autocomplete="off" />
                                </div>
                            </div>
                            {this.props.inviteCode && <div>
                                <label for="inviteCode">
                                    Invite Code
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" id="inviteCode"
                                        name="inviteCode" disabled value={this.props.inviteCode } autocomplete="off" />
                                </div>
                            </div>}
                            <div>
                                <button class="btn btn-primary btnStandard" type="summit">Register</button>
                            </div>
                        </form>
                    }
                    {state.registered && <Fragment>
                        <div class="admin-title">
                            Successfully registerd
                        </div>
                        <button class="btn btn-primary btnStandard" onclick={e => route("/login", true)}>Continue to login</button>
                    </Fragment>}
                </div>
            </div>
        </div>;
    }
}
