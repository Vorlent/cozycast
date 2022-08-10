import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { route } from '/js/libs/preact-router/index.js'

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
