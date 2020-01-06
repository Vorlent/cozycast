import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState, sendMessage } from '/js/index.js'

function deleteRoom(roomId) {
    console.log("DELETE ROOM " + roomId)
}

export class RoomList extends Component {

    componentWillMount() {
        updateState(function (state) {
            state.roomlist = [
                { id: "default", name: "default", userCount: 2 },
                { id: "niceboard", name: "niceboard", userCount: 3 },
                { id: "meanies", name: "meanies", userCount: 1 },
                { id: "wotos", name: "wotos", userCount: 999 }
            ]
        })
    }

    render({ state }, { xyz = [] }) {
        console.log(state)
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
                            <td><button type="button" class="btn btn-primary" onclick=${e => deleteRoom(room.id)}}>
                                Delete
                            </button></td>
                        </tr>
                    `)}
                    </tbody>
                </table>
                <button type="button" class="btn btn-primary">
                    Create Room
                </button>
            </div>
        </div>
    `;
    }
}
