import { Component, render, h } from 'preact'
import { route } from 'preact-router'
import { DefaultButton } from './DefaultButton.js';
import { InfoScreen } from './InfoScreen.js';

export class Access extends Component {

    state = {
        message: "checking Acess",
        submessage: "please wait",
    }

    componentWillMount() {
        fetch('/api/invite/access/' + this.props.code).then((e) => {
            if (e.status != 200)
                this.setState({ message: "Error", submessage: "Invalid access link" })
            else {
                e.json().then((e) => {
                    route(`/room/${e.name}?access=${this.props.code}`, false)
                }
                )

            }
        })
    }

    render({ code }, { state }) {
        return <InfoScreen message={this.state.message} submessage={this.state.submessage}>
            <div class="inviteButtonContainer">
                <DefaultButton enabled={true} onclick={e => route("/", false)}>
                    exit
                </DefaultButton>
            </div>
        </InfoScreen>;
    }
}
