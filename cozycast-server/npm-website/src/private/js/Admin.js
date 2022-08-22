import { Component } from 'preact'
import { html } from 'htm/preact'

export class Admin extends Component {
    constructor(props){
        super(props);
        this.state = {
            username: "",
            password: "",
            loggedIn: false
        }
    }

    login = () => {
        fetch('/login', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: this.state.username,
                password: this.state.password
            })
        }).then((e) => e.json()).then((e) => {
            if(e && e.access_token) {
                localStorage.setItem("adminToken", e.access_token);
                this.setState({loggedIn: true});
            }
        });
        this.setState({
            username: "",
            password: ""
        })
    }

    logout = () => {
            localStorage.removeItem("adminToken");
            this.setState({loggedIn: false});
    }

    componentWillMount() {
        this.setState({loggedIn: localStorage.getItem("adminToken") != null})
    }

    updateAdminUsername = (value) => {
        this.setState({username: value});
    }

    updateAdminPassword = (value) => {
        this.setState({password: value});
    }

    render( _ , state) {
    return html`
        <div class="admin-background">
            <div class="admin">
                <div class="admin-modal">
                ${!state.loggedIn && html`
                    <div class="admin-title">
                        Login
                    </div>
                    <div>
                        Username
                    </div>
                    <div>
                        <input class="modal-username" type="text"
                            onInput=${e => this.updateAdminUsername(e.target.value)}
                            name="username" maxlength="12" value="${state.username}"/>
                    </div>
                    <div>
                        Password
                    </div>
                    <div>
                        <input class="modal-username" type="password"
                            onInput=${e => this.updateAdminPassword(e.target.value)}
                            name="username" maxlength="64" value="${state.password}"/>
                    </div>
                    <button class="btn btn-primary" onclick=${this.login}>Login</button>
                `}
                ${state.loggedIn && html`
                    <div class="admin-title">
                        Logged in
                    </div>
                    <button class="btn btn-primary" onclick=${this.logout}>Logout</button>
                `}
                </div>
            </div>
        </div>`;
    }
}
