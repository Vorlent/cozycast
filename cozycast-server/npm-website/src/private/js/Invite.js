import { Component } from 'preact'
import { route } from 'preact-router'
import { authFetch , TokenStatus} from './Authentication.js'

export class Invite extends Component {

    componentWillMount() {
        authFetch('/api/invite/use/' + this.props.code)
        .then((e) => {
            if(e == TokenStatus.EXPIRED || e == TokenStatus.NO_TOKEN) {
                route("/", true);
                alert("Please log in to use invites/Invite expired");
            } else {
                route("/", true);
                alert("Successfully used invite");
            }
        });
    }

    render({ code }, { xyz = [] }) {
        return null;
    }
}
