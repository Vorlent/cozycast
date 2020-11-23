import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState } from '/js/index.js'
import { sendMessage } from '/js/Room.js'

export class Admin extends Component {

    login() {
        fetch('/login', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: state.admin.username,
                password: state.admin.password
            })
        }).then((e) => e.json()).then(function (e) {
            updateState(function (state) {
                if(e && e.access_token) {
                    localStorage.setItem("adminToken", e.access_token);
                    state.admin.loggedIn = true;
                }
            })
        });
        updateState(function (state) {
            state.admin.username = ""
            state.admin.password = ""
        })
    }

    logout() {
        updateState(function (state) {
            localStorage.removeItem("adminToken");
            state.admin.loggedIn = false;
        })
    }

    componentWillMount() {
        updateState(function (state) {
            state.admin.loggedIn = localStorage.getItem("adminToken") != null;
        })
    }

    updateAdminUsername(value) {
        updateState(function (state) {
            state.admin.username = value
        })
    }

    updateAdminPassword(value) {
        updateState(function (state) {
            state.admin.password = value
        })
    }

    render({ state }, { xyz = [] }) {
    return html`
        <div class="admin-background">
            <div class="admin">
                <div class="admin-modal">
                ${!state.admin.loggedIn && html`
                    <div class="admin-title">
                        Login
                    </div>
                    <div>
                        Username
                    </div>
                    <div>
                        <input class="modal-username" type="text"
                            onInput=${e => this.updateAdminUsername(e.target.value)}
                            name="username" maxlength="12" value="${state.admin.username}"/>
                    </div>
                    <div>
                        Password
                    </div>
                    <div>
                        <input class="modal-username" type="password"
                            onInput=${e => this.updateAdminPassword(e.target.value)}
                            name="username" maxlength="64" value="${state.admin.password}"/>
                    </div>
                    <button class="btn btn-primary" onclick=${this.login}>Login</button>
                `}
                ${state.admin.loggedIn && html`
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
