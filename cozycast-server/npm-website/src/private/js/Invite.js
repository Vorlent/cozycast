import { Component } from 'preact'
import { route } from 'preact-router'

export class Invite extends Component {

    componentWillMount() {
        fetch('/api/invite/use/' + this.props.code)
        .then((e) => {
            if(e.status != 200) {
                route("/", true);
            } else {
                e.json().then((e) => {
                    localStorage.setItem("room-" + e.room + "-token", e.token);
                    route("/room/" + e.room, true);
                })
            }
        });
    }

    render({ code }, { xyz = [] }) {
        return null;
    }
}
