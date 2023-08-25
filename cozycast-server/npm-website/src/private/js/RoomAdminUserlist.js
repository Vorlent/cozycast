import { h } from 'preact'
import { authFetch } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js'
import { BanModal } from './BanModal.js';
import { useContext, useEffect, useState } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext.js';

const UserRow = ({ user, defaultPerms, filterUsers, updatePerm, setBanTarget }) => {
    const { userId, nickname, nameColor, avatarUrl, anonymous, trusted, invited, tempInviteName, remote_permission, image_permission } = user;

    const onCheckboxToggle = (e) => {
        filterUsers(userId, e.target.name, e.target.checked);
    };

    return (
        <tr class="default-list-element">
            <td class="default-list-avatar-container-header ">
                <img src={avatarUrl} className="default-list-avatar-image-header"></img>
            </td>
            <td style={{ color: nameColor }} className="nickname">
                {nickname}
            </td>
            <td>{userId}</td>
            <td>
                <input name="trusted" onclick={onCheckboxToggle} type="checkbox" checked={trusted} className="trusted"></input>
            </td>
            <td>
                <input
                    name="invited"
                    onclick={onCheckboxToggle}
                    type="checkbox"
                    checked={invited || trusted}
                    className="invited"
                />
            </td>
            <td>{tempInviteName}</td>
            <td>
                <input
                    name="remote_permission"
                    onclick={onCheckboxToggle}
                    type="checkbox"
                    checked={trusted || remote_permission}
                    className="remotePermission"
                ></input>
                (<input type="checkbox" disabled checked={defaultPerms.default_remote_permission || trusted || remote_permission}></input>)
            </td>
            <td>
                <input
                    name="image_permission"
                    onclick={onCheckboxToggle}
                    type="checkbox"
                    checked={!anonymous && (trusted || image_permission)}
                    className="imagePermission"
                    disabled={anonymous}
                />
                (<input type="checkbox" disabled checked={!anonymous && (defaultPerms.default_image_permission || trusted || image_permission)}></input>)
            </td>
            <td class="default-list-table-center">
                <DefaultButton enabled={true} onclick={() => { updatePerm(user) }}>
                    Save
                </DefaultButton>
            </td>
            <td class="default-list-table-center">
                <DefaultButton
                    enabled={true}
                    onclick={() => { setBanTarget(user.userId); }}
                >
                    Ban/Kick
                </DefaultButton>
            </td>
        </tr>
    );
};

export const RoomAdminUserlist = () => {
    const { userlistAdmin, roomSettings, sendMessage } = useContext(WebSocketContext);

    const [userlist, setUserlist] = useState([...userlistAdmin.value]);
    const [defaultPerms, setDefaultPerms] = useState({...roomSettings.value})
    const [banTarget, setBanTarget] = useState(null);

    useEffect(() => {
        setDefaultPerms({...roomSettings.value});
    }, [roomSettings.value])

    useEffect(() => {
        setUserlist([...userlistAdmin.value]);
    }, [userlistAdmin.value])

    const deletePerm = (room, username) => {
        authFetch(`/api/permission/${room}/${username}`, { method: "DELETE" }).then(refresh)
    }

    const updatePerm = (perm) => {
        sendMessage({
            action: 'updatePermission',
            userId: perm.userId,
            invited: perm.invited,
            remote_permission: perm.remote_permission,
            image_permission: perm.image_permission,
            trusted: perm.trusted
        })
    }

    const refresh = () => {
        setDefaultPerms({...roomSettings.value});
        sendMessage({
            action: 'getuserinfo'
        })
    }

    const filterUsers = (userId, field, value) => {
        const newList = userlist.map((user) => {
            if (user.userId === userId) {
                return { ...user, [field]: value };
            }
            return user;
        });
        setUserlist(newList);
    };

    const updateRoomDefault = () => {
        sendMessage({
            action: 'room_access_save',
            default_image_permission: "" + defaultPerms.default_image_permission,
            default_remote_permission: "" + defaultPerms.default_remote_permission
        });
    }

    return (
        <div class="default-list-background">
            {banTarget && (
                <BanModal
                    closeModal={setBanTarget}
                    sendMessage={sendMessage}
                    banTarget={banTarget}
                ></BanModal>
            )}
            <table class="default-list">
                <tr>
                    <th>Avatar</th>
                    <th>Nickname</th>
                    <th>Username</th>
                    <th>Trusted</th>
                    <th>Invited</th>
                    <th>Invite Name</th>
                    <th>Remote</th>
                    <th>Images</th>
                    <th></th>
                    <th class="default-list-table-center">
                        <DefaultButton enabled={true} onclick={refresh}>
                            Refresh
                        </DefaultButton>
                    </th>
                </tr>
                <tbody>
                    <tr class="default-list-element">
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>
                            (<input
                                type="checkbox"
                                checked={defaultPerms.default_remote_permission}
                                onclick={() =>
                                    setDefaultPerms(({ default_remote_permission }) => ({
                                        default_remote_permission: !default_remote_permission,
                                    }))
                                }
                                className="defaultRemoteToggle"
                            ></input>
                            default)
                        </td>
                        <td>
                            (<input
                                type="checkbox"
                                checked={defaultPerms.default_image_permission}
                                onclick={() =>
                                    setDefaultPerms(({ default_image_permission }) => ({
                                        default_image_permission: !default_image_permission,
                                    }))
                                }
                                className="defaultImageToggle"
                            ></input>
                            default)
                        </td>
                        <td class="default-list-table-center">
                            <DefaultButton enabled={true} onclick={updateRoomDefault}>
                                Update
                            </DefaultButton>
                        </td>
                        <td></td>
                    </tr>
                </tbody>
                {userlist.map((user) =>
                    <UserRow user={user} defaultPerms={defaultPerms} filterUsers={filterUsers} updatePerm={updatePerm} setBanTarget={setBanTarget} />)
                }
            </table>
        </div>
    );
}
