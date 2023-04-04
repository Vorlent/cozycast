import { h, Component } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton} from './DefaultButton.js'
import { BanModal } from './BanModal.js';

export class RoomAdminUserlist extends Component {

    constructor(props) {
        super(props);
        this.state = {
            banModal: false,
            banTarget: null,
            changed: false,
            room: this.props.room,
            userlistadmin: this.props.userlistadmin,
            default_remote_permission: this.props.default_remote_permission,
            default_image_permission: this.props.default_image_permission
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if(this.props.userlistadmin !== prevProps.userlistadmin) {
            this.setState({
                changed: false,
                userlistadmin: this.props.userlistadmin
            })
        }
    }

    deletePerm(room,username){
        authFetch(`/api/permission/${room}/${username}`,{method: "DELETE"}).then(e => this.refresh())
    }

    updatePerm = (perm) => {
        this.props.sendMessage({
            action: 'updatePermission',
            userId: perm.userId,
            invited: perm.invited,
            remote_permission: perm.remote_permission,
            image_permission: perm.image_permission,
            trusted: perm.trusted
        })
    }

    refresh = () => {
        this.setState({
                default_remote_permission: this.props.default_remote_permission,
                default_image_permission: this.props.default_image_permission})
        this.props.sendMessage({
            action: 'getuserinfo'
        })
    }

    filterUsers = (userId,field,value) => {
        let source;
        if(this.state.changed) source = this.state.userlistadmin;
        else source = this.props.userlistadmin;

        let newList = source.filter(user => {if(user.userId == userId) {user[field] = value} return user});
        this.setState(state => {return {
            changed: true,
            userlistadmin: newList}});
    }

    updateRoomDefault = () => {
        this.props.sendMessage({
            action: 'room_access_save',
            default_image_permission: "" + this.state.default_image_permission,
            default_remote_permission: "" + this.state.default_remote_permission
        });
    }

    render({profile} , state) {
        return <div class="accountListBackground">
        {state.banModal && <BanModal updateSettingsState={this.setState.bind(this)} sendMessage={this.props.sendMessage} banTarget={state.banTarget}></BanModal> }
        <table class="accountList">
            <tr>
                <td>Avatar</td>
                <td>Nickname</td>
                <td>Username</td>
                <td>trusted</td>
                <td>Invited</td>
                <td>remote permission</td>
                <td>image permission</td>
                <td></td>
                <td class="tableCenter">
                    <DefaultButton enabled={true} 
                    onclick={this.refresh}>Refresh</DefaultButton>
                </td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>(<input type="checkbox" checked={state.default_remote_permission} onclick={() => this.setState(({ default_remote_permission }) => ({ default_remote_permission: !default_remote_permission }))}></input>default)</td>
                <td>(<input type="checkbox" checked={state.default_image_permission} onclick={() => this.setState(({ default_image_permission }) => ({ default_image_permission: !default_image_permission }))}></input>default)</td>
                <td class="tableCenter">
                    <DefaultButton enabled={true} 
                    onclick={this.updateRoomDefault}>Update</DefaultButton>
                </td>
                <td></td>
            </tr>
            {state.userlistadmin.map(user => 
            <tr class="accountElement">
                <td class="avatarContainerHeader"><img src={user.avatarUrl} class="avatarImageHeader"></img></td>
                <td class="inviteColumn" style={{color: user.nameColor}}>{user.nickname}</td>
                <td class="inviteColumn">{user.userId}</td>
                <td class="inviteColumn"><input onclick={()=> this.filterUsers(user.userId, "trusted", !user.trusted)} type="checkbox" checked={user.trusted}></input></td>
                <td class="inviteColumn"><input onclick={()=> this.filterUsers(user.userId, "invited", !user.invited)} type="checkbox" checked={user.trusted || user.invited}/>{user.inviteName}</td>
                <td class="inviteColumn">
                    <input onclick={()=> this.filterUsers(user.userId, "remote_permission", !user.remote_permission)} type="checkbox" checked={user.trusted || user.remote_permission}></input>
                    (<input type="checkbox" disabled checked={state.default_remote_permission || user.trusted || user.remote_permission }></input>)
                </td>
                <td class="inviteColumn">
                    <input onclick={()=> this.filterUsers(user.userId, "image_permission", !user.image_permission)} disabled={user.anonymous} type="checkbox" checked={!user.anonymous && (user.trusted || user.image_permission)}></input>
                    (<input type="checkbox" disabled checked={!user.anonymous && (state.default_image_permission || user.trusted || user.image_permission)}></input>)
                    </td>
                <td class="tableCenter">
                    <DefaultButton enabled={true} 
                    onclick={() => {this.updatePerm(user)}}>Save</DefaultButton>
                </td>
                <td class="tableCenter">
                    <DefaultButton enabled={true} 
                    onclick={() => {this.setState({banModal: true, banTarget: user.userId})}}>Ban/Kick</DefaultButton>
                </td>
            </tr>)}
        </table>
        </div>
    }
}
