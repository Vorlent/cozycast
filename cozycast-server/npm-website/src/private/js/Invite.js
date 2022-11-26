import { Component, render, h, Fragment } from 'preact'
import { route } from 'preact-router'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js';
import { InfoScreen } from './InfoScreen.js';

export class Invite extends Component {

    state = {
        message: "checking invite",
        submessage: "please wait",
        validInvite: false
    }

    componentWillMount() {
        authFetch('/api/invite/use/' + this.props.code)
            .then((e) => {
                if (e == TokenStatus.EXPIRED || e == TokenStatus.NO_TOKEN) {
                    fetch('/api/invite/check/' + this.props.code).then(e => {
                        if (e.status != 200)
                            this.setState({ message: "Error", submessage: "Invite invlaid or expired" })
                        else {
                            this.setState({ message: "Not logged in", submessage: "Please log in to use an invite", validInvite: true })
                            this.props.setAppState(state => { return { inviteCode: this.props.code } })
                        }
                    })

                } else if (e.status == 200) {
                    this.props.updatePermissions();
                    this.props.setAppState(state => { return { inviteCode: undefined } })
                    this.setState({ message: "Success", submessage: "Invite used" })
                }
                else {
                    this.setState({ message: "Invalid invite", submessage: undefined })
                }
            });
    }

    render({ code }, { state }) {
        if (!this.state.validInvite) {
            return <InfoScreen message={this.state.message} submessage={this.state.submessage}>
                <DefaultButton enabled={true} onclick={e => route("/", false)}>
                    ok
                </DefaultButton>
            </InfoScreen>;
        }
        return <InfoScreen message={this.state.message} submessage={this.state.submessage}>
            <div class="inviteButtonContainer">
                <DefaultButton enabled={true} onclick={e => route("/login", false)}>
                    login
                </DefaultButton>
                <DefaultButton enabled={true} onclick={e => route("/register", false)}>
                    register
                </DefaultButton>
            </div>
        </InfoScreen>;
    }
}
