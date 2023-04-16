import { h, Fragment } from 'preact'
import { route } from 'preact-router'
import { useContext } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext';
import { useSignal } from '@preact/signals';

export const Register = ({ updateProfile }) => {
    const { inviteCode, loggedIn } = useContext(AppStateContext);

    const username = useSignal("");
    const password = useSignal("");
    const confirmPassword = useSignal("");
    const registerComplete = useSignal(false);

    const onSubmit = e => {
        e.preventDefault();
        register();
    }

    const register = () => {
        if (password.value != confirmPassword.value) {
            alert("Passwords do not match");
            return;
        }
        fetch("/register", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username.value,
                password: password.value,
                inviteCode: inviteCode.value
            })
        }).then((e) => {
            if (e.status == 200) {
                registerComplete.value = true;
                inviteCode.value = undefined;
            } else e.json().then(e => alert(e.errors.join("\n")))
        });
    }

    const updateUsername = (e) => {
        username.value = e.target.value;
    }

    const updatePassword = (e) => {
        password.value = e.target.value;
    }

    const updateConfirmPassword = (e) => {
        confirmPassword.value = e.target.value;
    }

    return (
        <div class="admin-background">
            <div class="admin">
                <div class="admin-modal">
                    {!(loggedIn.value || registerComplete.value) &&
                        <form class="formStandard" onSubmit={onSubmit} id="registerForm" autocomplete="off" >
                            <div class="admin-title">
                                Register
                            </div>
                            <div>
                                <label for="usernameInputRegister">
                                    Username
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="text" id="usernameInputRegister"
                                        onInput={updateUsername}
                                        name="usernameRegister" maxlength="12" value={username} autocomplete="off" />
                                </div>
                            </div>
                            <div>
                                <label for="passwordInputRegister">
                                    Password
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="password" id="passwordInputRegister"
                                        onInput={updatePassword}
                                        name="passwordRegister" maxlength="64" value={password} autocomplete="off" />
                                </div>
                            </div>
                            <div>
                                <label for="passwordInputConfirm">
                                    Confirm Password
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" type="password" id="passwordInputConfirm"
                                        onInput={updateConfirmPassword}
                                        name="confirmPassword" maxlength="64" value={confirmPassword} autocomplete="off" />
                                </div>
                            </div>
                            {inviteCode.value && <div>
                                <label for="inviteCode">
                                    Invite Code
                                </label>
                                <div>
                                    <input class="modal-username standardInputField" id="inviteCode"
                                        name="inviteCode" disabled value={inviteCode} autocomplete="off" />
                                </div>
                            </div>}
                            <div>
                                <button class="btn btn-primary btnStandard" type="summit">Register</button>
                            </div>
                        </form>
                    }
                    {(loggedIn.value || registerComplete.value) && <Fragment>
                        <div class="admin-title">
                            Successfully registerd
                        </div>
                        <button class="btn btn-primary btnStandard" onclick={e => route("/login", true)}>Continue to login</button>
                    </Fragment>}
                </div>
            </div>
        </div>
    );
}
