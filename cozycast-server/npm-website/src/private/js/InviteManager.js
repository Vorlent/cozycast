import { h, Component } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js';

export class InviteManager extends Component {

    constructor(props) {
        super(props);
        this.state = {
            invites: []
        }
    }

    componentDidMount(){
        this.refresh();
    }

    refresh(){
        authFetch("/api/invite/all").then(e => {
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
                        this.setState(state => {return {invites: e}})
                    }) 
            }
        }
        )
    }

    deleteInvite(code){
        authFetch(`/api/invite/${code}`,{method: "DELETE"}).then(e => this.refresh())
    }

    render(_, state) {
        return <div class="accountListBackground"><table class="accountList">
            <tr>
                <td>room</td>
                <td>uses</td>
                <td>remote permission</td>
                <td>image permission</td>
                <td>expired</td>
                <td>link</td>
                <td>name</td>
                <td></td>
            </tr>          
            {state.invites.map(invite => 
            <tr class="accountElement">
                <td class="inviteColumn">{invite.room}</td>
                <td class="inviteColumn">{invite.uses} / {invite.maxUses? invite.maxUses : '∞'}</td>
                <td class="inviteColumn">{invite.remote_permission? 'remote allowed' : 'no remote'}</td>
                <td class="inviteColumn">{invite.image_permission? 'can post images' : 'no images'}</td>
                <td class="inviteColumn">{invite.expired ? 'expired' : 'active'}</td>
                <td class="inviteColumn">{location.host + '/invite/' + invite.id}</td>
                <td class="inviteColumn">{invite.inviteName ? invite.inviteName : ""}</td>
                <td class="tableCenter">
                    <DefaultButton enabled={true} onclick={() => this.deleteInvite(invite.id)}>Delete</DefaultButton>
                </td>
            </tr>)}
        </table>
        </div>
    }
}
