import { h, Component } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'

export class PermissionManager extends Component {

    constructor(props) {
        super(props);
        this.state = {
            permissions: [],
            newPerm: {
                "room": "",
                "invited": false,
                "banned": false,
                "remote_permission": false,
                "image_permission": false,
                "userId": ""
            }
        }
    }

    componentDidMount(){
        this.refresh();
    }

    refresh(){
        authFetch("/api/permission/all").then(e => {
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

    deletePerm(username){
        authFetch(`/api/permission/${username}`,{method: "DELETE"}).then(e => this.refresh())
    }

    updatePerm = () => {
        authFetch(`/api/permission/`,{
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.state.newPerm)
        }).then(e => this.refresh())
    }

    render({profile} , state) {
        return <div class="accountListBackground">
        <table class="accountList">
            <tr>
                <td>room</td>
                <td>user</td>
                <td>invited</td>
                <td>banned</td>
                <td>remote permission</td>
                <td>image permission</td>
            </tr>
            <tr class="accountElement">
                <td class="inviteColumn"><input value={state.newPerm.room} oninput={(e) => this.setState(state => {return {newPerm: {...state.newPerm, room: e.target.value}}})}></input></td>
                <td class="inviteColumn"><input value={state.newPerm.userId} oninput={(e) => this.setState(state => {return {newPerm: {...state.newPerm, userId: e.target.value}}})}></input></td>
                <td class="inviteColumn"><input type="checkbox" checked={state.newPerm.invited} onclick={() => this.setState(state => {return {newPerm: {...state.newPerm, invited: !state.newPerm.invited}}})}></input></td>
                <td class="inviteColumn"><input type="checkbox" checked={state.newPerm.banned}  onclick={() => this.setState(state => {return {newPerm: {...state.newPerm, banned: !state.newPerm.banned}}})}></input></td>
                <td class="inviteColumn"><input type="checkbox" checked={state.newPerm.remote_permission}  onclick={() => this.setState(state => {return {newPerm: {...state.newPerm, remote_permission: !state.newPerm.remote_permission}}})}></input></td>
                <td class="inviteColumn"><input type="checkbox" checked={state.newPerm.image_permission}  onclick={() => this.setState(state => {return {newPerm: {...state.newPerm, image_permission: !state.newPerm.image_permission}}})}></input></td>
                <td class="accountButtons">
                    <button type="button" class="btn btn-danger" onclick={this.updatePerm}>Create</button>
                </td>
            </tr>
            {state.permissions.map(perm => 
            <tr class="accountElement">
                <td class="inviteColumn">{perm.room}</td>
                <td class="inviteColumn">{perm.userId}</td>
                <td class="inviteColumn"><input onclick={(e) => e.preventDefault()} type="checkbox" checked={perm.invited}></input></td>
                <td class="inviteColumn"><input onclick={(e) => e.preventDefault()} type="checkbox" checked={perm.banned}></input></td>
                <td class="inviteColumn"><input onclick={(e) => e.preventDefault()} type="checkbox" checked={perm.remote_permission}></input></td>
                <td class="inviteColumn"><input onclick={(e) => e.preventDefault()} type="checkbox" checked={perm.image_permission}></input></td>
                <td class="accountButtons">
                    <button type="button" class="btn btn-danger" 
                    onclick={() => this.setState({newPerm:{
                        room: perm.room,
                        invited: perm.invited,
                        banned: perm.banned,
                        remote_permission: perm.remote_permission,
                        image_permission: perm.image_permission,
                        userId: perm.userId
                    }})}>Edit</button>
                </td>
            </tr>)}
        </table>
        </div>
    }
}
