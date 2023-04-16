import { h, Fragment } from 'preact'
import { InviteModal } from './InviteModal.js'
import { authFetch, optAuthFetch } from './Authentication.js'
import { route } from 'preact-router'
import { useContext, useEffect, useState } from 'preact/hooks'
import { AppStateContext } from './appstate/AppStateContext.js'

export const RoomList = () => {
    const { profile, cozyMessage } = useContext(AppStateContext);

    const [rooms, setRooms] = useState([]);
    const [inviteModal, setInviteModal] = useState(null);

    const deleteRoom = (roomId) => {
        authFetch('/api/room/' + roomId, { method: "DELETE" })
            .then(e => {
                refresh()
            });
    }

    const refresh = () => {
        optAuthFetch('/api/room').then((e) => e.json()).then((e) => {
            setRooms(e);
        });
    }

    const closeInviteModal = () => {
        setInviteModal(null);
    }

    useEffect(() => {
        refresh();
    }, []);


    return (
        <div class="roomManagement">
            <div class="room-list-background">
                {inviteModal && <InviteModal roomId={inviteModal} closeModal={closeInviteModal} />}
                <div class="room-list">
                    <div class="room-message">{cozyMessage.value.split("\n").map((message, index) => <Fragment>{index != 0 && <br />}{message}</Fragment>)}</div>
                    <div class="room-list-title">
                        Rooms
                    </div>
                    <table class="room-list-table">
                        <colgroup>
                            {profile.value.admin &&
                                <Fragment>
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '45%' }} />
                                    <col style={{ width: '15%' }} />
                                    <col style={{ width: '20%' }} />
                                </Fragment>
                            }
                            {!profile.value.admin &&
                                <Fragment>
                                    <col style={{ width: '60%' }} />
                                    <col style={{ width: '20%' }} />
                                    <col style={{ width: '20%' }} />
                                </Fragment>
                            }
                        </colgroup>
                        <tbody>
                            {rooms.map(room =>
                                <tr>
                                    {profile.value.admin &&
                                        <Fragment>
                                            <td><button type="button" class="btn btn-primary btnStandard" onclick={e => deleteRoom(room.id)}>
                                                Delete
                                            </button></td>
                                            <td><button type="button" class="btn btn-primary btnStandard" onclick={e => setInviteModal(room.id)}>
                                                Invite
                                            </button></td>
                                        </Fragment>
                                    }
                                    <td><span class="room-list-entry-name">{room.id}</span>
                                        {room.inviteOnly && <span class="room-badge">Invite Only</span>}
                                        {room.verifiedOnly && <span class="room-badge">Verified Only</span>}
                                        {room.accountOnly && <span class="room-badge">Account Only</span>}</td>
                                    <td><span class="room-list-entry-usercount">{room.userCount} users</span></td>
                                    <td class="room-list-join-column" ><button type="button" class="btn btn-danger btn-join btnStandard" onclick={e => route(`/room/${room.id}`, true)}
                                        disabled={!room.open}>
                                        {room.open ? 'Join' : 'Closed'}
                                    </button></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {(rooms.length == 0) && <div>Currently none availaible</div>}
                </div>
            </div>
        </div>
    );
}
