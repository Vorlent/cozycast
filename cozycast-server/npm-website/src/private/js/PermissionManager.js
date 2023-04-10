import { h, Component } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton} from './DefaultButton.js'

export class PermissionManager extends Component {

    defaultPerms = {
        "room": this.props.room ? this.props.room : "",
        "invited": false,
        "banned": false,
        "remote_permission": false,
        "image_permission": false,
        "userId": "",
        inviteName: "",
        trusted: false
    }

    constructor(props) {
        super(props);
        this.state = {
            room: this.props.room,
            permissions: [],
            newPerm: {...this.defaultPerms
            }
        }
    }

    componentDidMount(){
        this.refresh();
    }

    refresh(){
        const apiName = this.state.room ? `/api/permission/${this.state.room}` : '/api/permission/all';

        authFetch(apiName).then(e => {
            switch(e){
                case TokenStatus.NO_TOKEN:
                    console.log("not logged in")
                    break;
                case TokenStatus.EXPIRED:
                    console.log("not logged in")
                    break;
                default:
                    e.json().then(e => {
                        console.log(e);
                        this.setState(state => {return {permissions: e}})
                    }) 
            }
        }
        )
    }

    deletePerm(room,username){
        authFetch(`/api/permission/${room}/${username}`,{method: "DELETE"}).then(e => this.refresh())
    }

    updatePerm = (perm) => {
        authFetch(`/api/permission/`,{
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(perm)
        }).then(e => this.refresh())
    }

    filterPermissions = (room, userId, field, value) => {
        const newPerms = this.state.permissions.map((perm) => {
            if (perm.userId === userId && perm.room === room) {
                return { ...perm, [field]: value };
            }
            return perm;
        });
        this.setState((state) => ({ permissions: newPerms }));
    };


    NewPermissionRow = (state, setState, updatePerm, defaultPerms) => {
        const {room: currentRoom, newPerm} = state
        const {room, userId, banned, trusted, invited, inviteName ,remote_permission, image_permission } = newPerm

        const onInputChange = (e) => {
            setState(({newPerm}) => ({
                newPerm: { ...newPerm, [e.target.name]: e.target.value },
            }));
        };

        const onCheckboxToggle = (e) => {
            setState(({newPerm}) => ({
                newPerm: { ...newPerm, [e.target.name]: e.target.checked},
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
                    <DefaultButton enabled={true} onclick={() => setState({ newPerm: { ...defaultPerms } })}>Clear</DefaultButton>
                </td>
            </tr>
        );
    };

    PermissionRow = (perm, filterPermissions, updatePerm, deletePerm) => {
        const {room, userId, banned, trusted, invited, inviteName ,remote_permission, image_permission } = perm;

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

    render(props, state) {
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
                        {this.NewPermissionRow(this.state,this.setState.bind(this),this.updatePerm.bind(this),this.defaultPerms)}

                        {state.permissions.map((perm) => (
                            this.PermissionRow(perm, this.filterPermissions,this.updatePerm.bind(this),this.deletePerm.bind(this))
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
}
