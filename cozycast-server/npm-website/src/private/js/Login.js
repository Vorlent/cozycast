import { h, Component, Fragment } from 'preact'
import { authLogin, logOut } from './Authentication';
import { Header } from './Header.js';
import { route } from 'preact-router'

export class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: ""
        }
    }

    login = () => {
        authLogin(this.state.username, this.state.password).then((e) => {
            if (e) {
                this.setState({
                    loggedIn: true,
                    username: "",
                    password: ""
                });
                this.props.login();
                route("/", true);
            } else {
                alert("Username or password is wrong")
            }
        });
    }

    onSubmit = e => {
        e.preventDefault();
        this.login();
    }


    updateAdminUsername = (value) => {
        this.setState({ username: value });
    }

    updateAdminPassword = (value) => {
        this.setState({ password: value });
    }

    render({ loggedIn, logout }, state) {
        return <div class="admin-background">
            <div class="admin">
                <div class="admin-modal">
                    {!loggedIn &&
                        <form class="formStandard" onSubmit={this.onSubmit}>
                            <div class="admin-title">
                                Login
                            </div>
                            <div>
                                <label for="usernameInput">
                                    Username
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="text" id="usernameInput"
                                        onInput={e => this.updateAdminUsername(e.target.value)}
                                        name="username" maxlength="12" value={state.username} />
                                </div>
                            </div>
                            <div>
                                <label for="passwordInput">
                                    Password
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="password" id="passwordInput"
                                        onInput={e => this.updateAdminPassword(e.target.value)}
                                        name="username" maxlength="64" value={state.password} />
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-primary btnStandard" type="summit">Login</button>
                            </div>
                        </form>
                    }
                    {loggedIn && <Fragment>
                        <div class="admin-title">
                            Logged in
                        </div>
                        <button class="btn btn-primary btnStandard" onclick={logout}>Logout</button>
                    </Fragment>}
                </div>
            </div>
        </div>;
    }
}
