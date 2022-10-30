import { Component, render, h } from 'preact'
import { route } from 'preact-router'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js';
import { InfoScreen } from './InfoScreen.js';

export class Invite extends Component {

    state = {
        message: "checking invite",
        submessage: "please wait"
    }

    componentWillMount() {
        authFetch('/api/invite/use/' + this.props.code)
            .then((e) => {
                if (e == TokenStatus.EXPIRED || e == TokenStatus.NO_TOKEN) {
                    fetch('/api/invite/check/' + this.props.code).then(e => {
                        if(e.status != 200)
                            this.setState({ message: "Error", submessage: "Invite invlaid or expired" })
                        else this.setState({ message: "Not logged in", submessage: "Please log in to use an invite" })
                    })
                    
                } else if (e.status == 410) {
                    this.setState({ message: "Invite expired", submessage: undefined })
                } else if (e.status == 200) {
                    this.props.updatePermissions();
                    this.setState({ message: "Success", submessage: "Invite used" })
                }
                else {
                    this.setState({ message: "Invalid invite", submessage: undefined })
                }
            });
    }

    render({ code }, { state }) {
        return <InfoScreen message={this.state.message} submessage={this.state.submessage}>
            <DefaultButton enabled={true} onclick={e => route("/", false)}>
                ok
            </DefaultButton>
        </InfoScreen>;
    }
}
