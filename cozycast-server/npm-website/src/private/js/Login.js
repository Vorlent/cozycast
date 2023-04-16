import { h, Fragment } from 'preact'
import { authLogin } from './Authentication';
import { route } from 'preact-router'
import { useSignal } from '@preact/signals';
import { useContext } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext';

export const Login = ({updateProfile}) => {
    const { inviteCode, loggedIn, logout } = useContext(AppStateContext);

    const username = useSignal("");
    const password = useSignal("");

    const login = () => {
        authLogin(username.value, password.value).then((e) => {
            if (e) {
                updateProfile();
                if (inviteCode.value) route(`/invite/${inviteCode.value}`, true);
                else route("/", true);
            } else {
                alert("Username or password is wrong")
            }
        });
    }

    const onSubmit = e => {
        e.preventDefault();
        login();
    }


    const updateUsername = (e) => {
        username.value = e.target.value;
    }

    const updatePassword = (e) => {
        password.value = e.target.value;
    }

    return (
        <div class="admin-background">
            <div class="admin">
                <div class="admin-modal">
                    {!loggedIn.value &&
                        <form class="formStandard" onSubmit={onSubmit}>
                            <div class="admin-title">
                                Login
                            </div>
                            <div>
                                <label for="usernameInput">
                                    Username
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="text" id="usernameInput"
                                        onInput={updateUsername}
                                        name="username" maxlength="12" value={username} />
                                </div>
                            </div>
                            <div>
                                <label for="passwordInput">
                                    Password
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="password" id="passwordInput"
                                        onInput={updatePassword}
                                        name="password" maxlength="64" value={password} />
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-primary btnStandard" type="summit">Login</button>
                            </div>
                        </form>
                    }
                    {loggedIn.value && <Fragment>
                        <div class="admin-title">
                            Logged in
                        </div>
                        <button class="btn btn-primary btnStandard" onclick={logout}>Logout</button>
                    </Fragment>}
                </div>
            </div>
        </div>
    );
}
