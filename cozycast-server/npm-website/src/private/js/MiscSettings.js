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

    render({ }, state) {
        return <div class="admin-background">
            <div class="misc-settings">
                <div style={{ width: "90%" }}>
                    <label for="messageInput">
                        Message
                    </label>
                    <div>
                        <textarea rows="3" class="modal-username standardInputField" type="text" id="messageInput"
                            onInput={e => this.setState({ message: e.target.value })}
                            name="message" value={state.message} />
                    </div>
                </div>
                <DefaultButton enabled={true} onclick={this.updateMessage}>Save message</DefaultButton>
                <label>
                    <input type="checkbox" checked={state.registerWithInviteOnly}
                        onclick={() => this.setState(state => { return { registerWithInviteOnly: !state.registerWithInviteOnly } })} />
                    Invite required for register
                </label>
                <DefaultButton enabled={true} onclick={this.updateFlag}>Save invite setting</DefaultButton>
            </div>
        </div>
    }
}
