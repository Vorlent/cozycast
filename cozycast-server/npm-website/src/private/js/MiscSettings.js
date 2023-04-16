import { h } from 'preact'
import { authFetch } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js';
import { useContext, useState } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext.js';

export const MiscSettings = ({refreshMisc}) => {
    const {registerWithInviteOnly, cozyMessage} = useContext(AppStateContext)
    let [newMessage, setNewMessage] = useState(cozyMessage.value);
    let [newInviteFlag, seInviteFlag] = useState(registerWithInviteOnly.value);

    const updateMessage = () => {
        authFetch(`/api/misc/message`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: newMessage
        }).then(onUpdate)
    }

    const updateFlag = () => {
        authFetch(`/api/misc/inviteOnly`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: newInviteFlag
        }).then(onUpdate)
    }

    const onUpdate = () => {
        refreshMisc();
        window.alert("updated!");
    }

    const updateSettings = () => {
        if (newMessage != cozyMessage.value) {
            updateMessage();
        }
        if (newInviteFlag != registerWithInviteOnly.value) {
            updateFlag();
        }
    };

    return (
            <div class="misc-settings">
                <div style={{ width: '90%' }}>
                    <label for="messageInput">Message</label>
                    <div>
                        <textarea
                            rows="3"
                            cols="60"
                            class="modal-username standardInputField"
                            type="text"
                            id="messageInput"
                            onInput={(e) => setNewMessage(e.target.value)}
                            name="message"
                            value={newMessage}
                        />
                    </div>
                </div>
                <label>
                    <input
                        type="checkbox"
                        checked={newInviteFlag}
                        onclick={() =>
                            seInviteFlag(flag => !flag)
                        }
                    />
                    Invite required for register
                </label>
                <div>
                    <DefaultButton enabled={true} onclick={updateSettings}>
                        Update Settings
                    </DefaultButton>
                </div>
            </div>
        );
}
