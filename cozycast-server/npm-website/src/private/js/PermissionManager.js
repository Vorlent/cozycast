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
        let apiName;
        if(this.state.room){
            apiName = `/api/permission/${this.state.room}`
        }
        else {
            apiName = "/api/permission/all"
        }

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

    filterPermissions = (room,userId,field,value) => {
        let newPerms = this.state.permissions.filter(perm => {if(perm.userId == userId && perm.room == room) {perm[field] = value} return perm});
        this.setState(state => {return {permissions: newPerms}});
    }

    render({profile} , state) {
        return <div class="accountListBackground">
        <table class="accountList">
            <tr>
                <td>room</td>
                <td>user</td>
                <td>banned</td>
                <td>trusted</td>
                <td>invited</td>
                <td>remote permission</td>
                <td>image permission</td>
            </tr>
            <tr class="accountElement accountElementSpecial">
                {this.props.room ? 
                    <td class="inviteColumn">{this.props.room}</td> : 
                    <td class="inviteColumn"><input value={state.newPerm.room} oninput={(e) => this.setState(state => {return {newPerm: {...state.newPerm, room: e.target.value}}})}></input></td>
                }
                <td class="inviteColumn"><input value={state.newPerm.userId} oninput={(e) => this.setState(state => {return {newPerm: {...state.newPerm, userId: e.target.value}}})}></input></td>
                <td class="inviteColumn"><input type="checkbox" checked={state.newPerm.banned}  onclick={() => this.setState(state => {return {newPerm: {...state.newPerm, banned: !state.newPerm.banned}}})}></input></td>
                <td class="inviteColumn"><input type="checkbox" checked={state.newPerm.trusted} onclick={() => this.setState(state => {return {newPerm: {...state.newPerm, trusted: !state.newPerm.trusted}}})}></input></td>
                <td class="inviteColumn"><input type="checkbox" checked={state.newPerm.invited || state.newPerm.trusted} onclick={() => this.setState(state => {return {newPerm: {...state.newPerm, invited: !state.newPerm.invited}}})}></input></td>
                <td class="inviteColumn"><input type="checkbox" checked={state.newPerm.remote_permission || state.newPerm.trusted}  onclick={() => this.setState(state => {return {newPerm: {...state.newPerm, remote_permission: !state.newPerm.remote_permission}}})}></input></td>
                <td class="inviteColumn"><input type="checkbox" checked={state.newPerm.image_permission || state.newPerm.trusted}  onclick={() => this.setState(state => {return {newPerm: {...state.newPerm, image_permission: !state.newPerm.image_permission}}})}></input></td>
                <td class="tableCenter">
                    <DefaultButton enabled={true} onclick={() => this.updatePerm(this.state.newPerm)}>Create</DefaultButton>
                </td>
                <td class="tableCenter">
                    <DefaultButton enabled={true} onclick={() => this.setState({newPerm: {...this.defaultPerms}})}>Clear</DefaultButton>
                </td>
            </tr>
            {state.permissions.map(perm => 
            <tr class="accountElement">
                <td class="inviteColumn">{perm.room}</td>
                <td class="inviteColumn">{perm.userId}</td>
                <td class="inviteColumn"><input onclick={()=> this.filterPermissions(perm.room, perm.userId, "banned", !perm.banned)} type="checkbox" checked={perm.banned}></input></td>
                <td class="inviteColumn"><input onclick={()=> this.filterPermissions(perm.room, perm.userId, "trusted", !perm.trusted)} type="checkbox" checked={perm.trusted}></input></td>
                <td class="inviteColumn"><input onclick={()=> this.filterPermissions(perm.room, perm.userId, "invited", !perm.invited)} type="checkbox" checked={perm.invited || perm.trusted}/>{perm.inviteName}</td>
                <td class="inviteColumn"><input onclick={()=> this.filterPermissions(perm.room, perm.userId, "remote_permission", !perm.remote_permission)} type="checkbox" checked={perm.remote_permission|| perm.trusted}></input></td>
                <td class="inviteColumn"><input onclick={()=> this.filterPermissions(perm.room, perm.userId, "image_permission", !perm.image_permission)} type="checkbox" checked={perm.image_permission|| perm.trusted}></input></td>
                <td class="tableCenter">
                    <DefaultButton enabled={true} 
                    onclick={() => {this.updatePerm(perm)}}>Update</DefaultButton>
                </td>
                <td class="tableCenter">
                    <DefaultButton enabled={true} onclick={() => this.deletePerm(perm.room,perm.userId)}>Delete</DefaultButton>
                </td>
            </tr>)}
        </table>
        </div>
    }
}
