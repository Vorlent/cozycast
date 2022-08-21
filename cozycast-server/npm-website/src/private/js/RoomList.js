import { Component } from 'preact'
import { html } from 'htm/preact'
import { InviteModal } from './InviteModal.js'

export class RoomList extends Component {
    constructor(props){
        super(props);
        this.state = {
            roomlist: [],
            inviteModal: false,
            currentRoom: null,
        }
    }

    deleteRoom(roomId) {
        var token = localStorage.getItem("adminToken");
        fetch('/api/room/' + roomId, { method: "DELETE", headers: { 'Authorization': "Bearer " + token } })
        .then(e => {
            this.refresh()
        });
    }

    refresh() {
        fetch('/api/room').then((e) => e.json()).then((e) => {
            this.setState({
                roomlist: e.map(room => ({ "id": room.id, "name": room.id, "userCount": room.userCount }))
            })
        });
    }

    componentWillMount() {
        this.refresh()
    }

    render({ state }, { xyz = [] }) {
    return html`
        <div class="room-list-background">
            ${this.state.inviteModal && html`<${InviteModal} state=${state} roomId=${this.state.currentRoom} updateSettingsState=${this.setState.bind(this)}/>`}
            <div class="room-list">
                <div class="room-list-title">
                    Rooms
                </div>
                <table class="room-list-table">
                    <colgroup>
                       <col style="width: 40%;"/>
                       <col style="width: 40%;"/>
                       <col style="width: 20%;"/>
                    </colgroup>
                    <tbody>
                    ${this.state.roomlist.map(room => html`
                        <tr>
                            <td><span class="room-list-entry-name"><a href="/room/${room.id}">${room.name}</a></span></td>
                            <td><span class="room-list-entry-usercount">${room.userCount} users</span></td>
                            <td><button type="button" class="btn btn-primary" onclick=${e => this.deleteRoom(room.id)}>
                                Delete
                            </button></td>
                            <td><button type="button" class="btn btn-primary" onclick=${e => this.setState({inviteModal: true, currentRoom: room.id})}>
                                Invite
                            </button></td>
                        </tr>
                    `)}
                    </tbody>
                </table>
            </div>
        </div>`;
    }
}
