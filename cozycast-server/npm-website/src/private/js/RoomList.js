import { Component, h, Fragment } from 'preact'
import { InviteModal } from './InviteModal.js'
import { authFetch} from './Authentication.js'
import { route } from 'preact-router'
import { DefaultButton } from './DefaultButton.js';

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
        authFetch('/api/room/' + roomId, { method: "DELETE" })
        .then(e => {
            this.refresh()
        });
    }

    refresh() {
        fetch('/api/room').then((e) => e.json()).then((e) => {
            this.setState({
                roomlist: e.map(room => ({ "id": room.id, "name": room.id, "userCount": room.userCount, "accountOnly": room.accountOnly,"verifiedOnly": room.verifiedOnly,"inviteOnly": room.inviteOnly}))
            })
        });
    }

    componentWillMount() {
        this.refresh()
    }

    canJoin(room) {
        if(room.inviteOnly){
            let perm = this.props.roomPerms.get(room.name);
            if(!perm || perm.banned) return false;
            return perm.invited;
        }
        if(room.accountOnly){
            return this.props.loggedIn
        }
        return true;
    }

    render({profile,loggedIn,roomPerms}) {
    return <div class="roomManagement">
            <div class="room-list-background">
                {this.state.inviteModal && <InviteModal roomId={this.state.currentRoom} updateSettingsState={this.setState.bind(this)}/>}
                <div class="room-list">
                    <div class="room-message">{this.props.message}</div>
                    <DefaultButton enabled={true} onclick={this.refresh.bind(this)} style="buttonRefresh">refresh</DefaultButton>
                    <div class="room-list-title">
                        Rooms
                    </div>
                    <table class="room-list-table">
                        <colgroup>
                            {profile.admin && 
                                <Fragment>
                                    <col style={{width: '10%'}}/>
                                    <col style={{width: '10%'}}/>
                                    <col style={{width: '45%'}}/>
                                    <col style={{width: '15%'}}/>
                                    <col style={{width: '20%'}}/>
                                </Fragment>
                            }
                            {!profile.admin && 
                                <Fragment>
                                    <col style={{width: '60%'}}/>
                                    <col style={{width: '20%'}}/>
                                    <col style={{width: '20%'}}/>
                                </Fragment>
                            }
                        </colgroup>
                        <tbody>
                        {this.state.roomlist.map(room =>
                            <tr>
                                {profile.admin && 
                                    <Fragment>
                                        <td><button type="button" class="btn btn-primary btnStandard" onclick={e => this.deleteRoom(room.id)}>
                                            Delete
                                            </button></td>
                                        <td><button type="button" class="btn btn-primary btnStandard" onclick={e => this.setState({inviteModal: true, currentRoom: room.id})}>
                                            Invite
                                            </button></td>
                                    </Fragment>
                                }
                                <td><span class="room-list-entry-name">{room.name}</span>
                                    {room.inviteOnly && <span class="room-badge">Invite Only</span>}
                                    {room.verifiedOnly && <span class="room-badge">Verified Only</span>}
                                    {room.accountOnly  && <span class="room-badge">Account Only</span>}</td>
                                <td><span class="room-list-entry-usercount">{room.userCount} users</span></td>
                                <td class ="room-list-join-column" ><button type="button" class="btn btn-danger btn-join btnStandard" onclick={e =>  route(`/room/${room.id}`,true) }
                                disabled={!(this.canJoin(room) || profile.verified)}>
                                        {(this.canJoin(room) || profile.verified)? 'Join' : 'Closed'}
                                        </button></td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    }
}
