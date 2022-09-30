import { h, Component, Fragment } from 'preact'
import { authLogin, logOut } from './Authentication';
import { Header } from './Header.js';
import { route } from 'preact-router'

export class Register extends Component {
    constructor(props){
        super(props);
        this.state = {
            username: "",
            password: "",
            registered: false
        }
    }

    onSubmit = e => {
        e.preventDefault();
        this.register();
    }

    register = () => {
        fetch("/register",{
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: this.state.username,
                password: this.state.password
            })}).then((e) => {
            if(e.status == 200) {
                this.setState({registered: true});
            } else e.json().then( e => alert(e.errors.join("\n")))
        });
        this.setState({
            username: "",
            password: ""
        })
    }

    updateAdminUsername = (value) => {
        this.setState({username: value});
    }

    updateAdminPassword = (value) => {
        this.setState({password: value});
    }

    render( _ , state) {
    return <div class="admin-background">
            <div class="admin">
                <div class="admin-modal">
                {!state.registered && 
                <form onSubmit={this.onSubmit} id="registerForm">
                    <div class="admin-title">
                        Register
                    </div>
                    <label for="usernameInput">
                        Username
                    </label>
                    <div>
                        <input class="modal-username" type="text" id="usernameInput"
                            onInput={e => this.updateAdminUsername(e.target.value)}
                            name="username" maxlength="12" value={state.username}/>
                    </div>
                    <label for="passwordInput">
                        Password
                    </label>
                    <div>
                        <input class="modal-username" type="password" id="passwordInput"
                            onInput={e => this.updateAdminPassword(e.target.value)}
                            name="password" maxlength="64" value={state.password}/>
                    </div>
                    <div>
                    <button class="btn btn-primary" type="summit">Register</button>
                    </div>
                </form>
                }
                {state.registered && <Fragment>
                    <div class="admin-title">
                        Successfully register
                    </div>
                    <button class="btn btn-primary" onclick={e => route("/login", true)}>Continue to login</button>
                </Fragment>}
                </div>
            </div>
        </div>;
    }
}
