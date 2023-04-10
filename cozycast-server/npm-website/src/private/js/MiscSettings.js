import { h, Component, Fragment } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js';

export class MiscSettings extends Component {

    constructor(props) {
        super(props);
        this.state = {
            message: this.props.message,
            registerWithInviteOnly: this.props.registerWithInviteOnly
        }
    }

    componentDidMount() {
    }

    refresh = () => {
        this.props.updateMisc();
    }

    updateMessage = () => {
        authFetch(`/api/misc/message`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: this.state.message
        }).then(e => this.refresh())
    }

    updateFlag = () => {
        authFetch(`/api/misc/inviteOnly`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: this.state.registerWithInviteOnly
        }).then(e => this.refresh())
    }

    updateSettings = () => {
        if (this.state.message != this.props.message) {
            this.updateMessage();
        }
        if (this.state.registerWithInviteOnly != this.props.registerWithInviteOnly) {
            this.updateFlag();
        }
    };

    render({ }, state) {
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
                            onInput={(e) => this.setState({ message: e.target.value })}
                            name="message"
                            value={state.message}
                        />
                    </div>
                </div>
                <label>
                    <input
                        type="checkbox"
                        checked={state.registerWithInviteOnly}
                        onclick={() =>
                            this.setState((state) => {
                                return { registerWithInviteOnly: !state.registerWithInviteOnly };
                            })
                        }
                    />
                    Invite required for register
                </label>
                <div>
                    <DefaultButton enabled={true} onclick={this.updateSettings}>
                        Update Settings
                    </DefaultButton>
                </div>
            </div>
        );
    }
}
