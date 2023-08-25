import { h } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js'
import { useEffect, useState } from 'preact/hooks'

const NewPermissionRow = ({ currentRoom, newPerm, setNewParm, defaultPerms }) => {
    const { room, userId, banned, trusted, invited, inviteName, remote_permission, image_permission } = newPerm

    const onInputChange = (e) => {
        setNewParm((newPerm) => ({
            newPerm: { ...newPerm, [e.target.name]: e.target.value },
        }));
    };

    const onCheckboxToggle = (e) => {
        setNewParm((newPerm) => ({
            newPerm: { ...newPerm, [e.target.name]: e.target.checked },
        }));
    };

    return (
        <tr className="default-list-element">
            {currentRoom ?
                <td>{room}</td> :
                <td><input name="room" value={room} oninput={onInputChange}></input></td>
            }
            <td><input name="userId" value={userId} oninput={onInputChange}></input></td>
            <td><input name="banned" type="checkbox" checked={banned} onclick={onCheckboxToggle}></input></td>
            <td><input name="trusted" type="checkbox" checked={trusted} onclick={onCheckboxToggle}></input></td>
            <td><input name="invited" type="checkbox" checked={invited || trusted} onclick={onCheckboxToggle}></input></td>
            <td><input name="inviteName" value={inviteName} oninput={onInputChange}></input></td>
            <td><input name="remote_permission" type="checkbox" checked={remote_permission || trusted} onclick={onCheckboxToggle}></input></td>
            <td><input name="image_permission" type="checkbox" checked={image_permission || trusted} onclick={onCheckboxToggle}></input></td>
            <td class="tableCenter">
                <DefaultButton enabled={true} onclick={() => updatePerm(newPerm)}>Create</DefaultButton>
            </td>
            <td class="tableCenter">
                <DefaultButton enabled={true} onclick={() => setNewParm({ newPerm: { ...defaultPerms } })}>Clear</DefaultButton>
            </td>
        </tr>
    );
};

const PermissionRow = ({ perm, filterPermissions, updatePerm, deletePerm }) => {
    const { room, userId, banned, trusted, invited, inviteName, remote_permission, image_permission } = perm;

    const onCheckboxToggle = (e) => {
        filterPermissions(room, userId, e.target.name, e.target.checked);
    };

    const onInputChange = (e) => {
        filterPermissions(room, userId, e.target.name, e.target.value);
    };

    return (
        <tr className="default-list-element">
            <td>{room}</td>
            <td>{userId}</td>
            <td><input name="banned" onclick={onCheckboxToggle} type="checkbox" checked={banned}></input></td>
            <td><input name="trusted" onclick={onCheckboxToggle} type="checkbox" checked={trusted}></input></td>
            <td><input name="invited" onclick={onCheckboxToggle} type="checkbox" checked={invited || trusted} /></td>
            <td><input name="inviteName" value={inviteName} oninput={onInputChange}></input></td>
            <td><input name="remote_permission" onclick={onCheckboxToggle} type="checkbox" checked={remote_permission || trusted}></input></td>
            <td><input name="image_permission" onclick={onCheckboxToggle} type="checkbox" checked={image_permission || trusted}></input></td>
            <td class="default-list-table-center">
                <DefaultButton enabled={true}
                    onclick={() => { updatePerm(perm) }}>Update</DefaultButton>
            </td>
            <td class="default-list-table-center">
                <DefaultButton enabled={true} onclick={() => deletePerm(room, userId)}>Delete</DefaultButton>
            </td>
        </tr>
    );
};

export const PermissionManager = ({ room }) => {

    const defaultPerms = {
        "room": room ? room : "",
        "invited": false,
        "banned": false,
        "remote_permission": false,
        "image_permission": false,
        "userId": "",
        inviteName: "",
        trusted: false
    }

    const [permissions, setPermissions] = useState([]);
    const [newPerm, setNewPerm] = useState({ ...defaultPerms })

    useEffect(() => {
        refresh();
    }, [])

    const refresh = () => {
        const apiName = room ? `/api/permission/${room}` : '/api/permission/all';

        authFetch(apiName).then(e => {
            switch (e) {
                case TokenStatus.NO_TOKEN:
                    console.log("not logged in")
                    break;
                case TokenStatus.EXPIRED:
                    console.log("not logged in")
                    break;
                default:
                    e.json().then(e => {
                        console.log('Fetched permissions:',e)
                        setPermissions(e)
                    })
            }
        }
        )
    }

    const deletePerm = (room, username) => {
        authFetch(`/api/permission/${room}/${username}`, { method: "DELETE" }).then(refresh)
    }

    const updatePerm = (perm) => {
        authFetch(`/api/permission/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(perm)
        }).then(refresh)
    }

    const filterPermissions = (room, userId, field, value) => {
        const newPerms = permissions.map((perm) => {
            if (perm.userId === userId && perm.room === room) {
                return { ...perm, [field]: value };
            }
            return perm;
        });
        setPermissions(newPerms);
    };

    return (
        <div className="default-list-background">
            <table className="default-list">
                <thead>
                    <tr>
                        <th>Room</th>
                        <th>User</th>
                        <th>Banned</th>
                        <th>Trusted</th>
                        <th>Invited</th>
                        <th>Invite Name</th>
                        <th>Remote</th>
                        <th>Images</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <NewPermissionRow
                        room={room}
                        newPerm={newPerm}
                        setNewParm={setNewPerm}
                        defaultPerms={defaultPerms}
                    />
                    {permissions.map((perm) => (
                        <PermissionRow
                            perm={perm}
                            filterPermissions={filterPermissions}
                            updatePerm={updatePerm}
                            deletePerm={deletePerm}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
