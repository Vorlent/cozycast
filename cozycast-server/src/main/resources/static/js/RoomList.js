import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState, sendMessage } from '/js/index.js'


export class RoomList extends Component {

    deleteRoom(roomId) {
        var token = localStorage.getItem("adminToken");
        fetch('/api/room/' + roomId, { method: "DELETE", headers: { 'Authorization': "Bearer " + token } })
        .then(e => {
            this.refresh()
        });
    }

    refresh() {
        fetch('/api/room').then((e) => e.json()).then(function (e) {
            updateState(function (state) {
                state.roomlist = e.map(room => ({ "id": room.id, "name": room.id, "userCount": room.userCount }))
            })
        });
    }

    componentWillMount() {
        this.refresh()
    }

    render({ state }, { xyz = [] }) {
    return html`
        <div class="room-list-background">
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
                    ${state.roomlist.map(room => html`
                        <tr>
                            <td><span class="room-list-entry-name"><a href="/room/${room.id}">${room.name}</a></span></td>
                            <td><span class="room-list-entry-usercount">${room.userCount} users</span></td>
                            <td><button type="button" class="btn btn-primary" onclick=${e => this.deleteRoom(room.id)}>
                                Delete
                            </button></td>
                        </tr>
                    `)}
                    </tbody>
                </table>
                <!--<button type="button" class="btn btn-primary">
                    Create Room
                </button>-->
            </div>
        </div>
    `;
    }
}
