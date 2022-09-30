import { h, Component } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'

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
                <td></td>
            </tr>          
            {state.invites.map(invite => 
            <tr class="accountElement">
                <td class="inviteColumn">{invite.room}</td>
                <td class="inviteColumn">{invite.uses}</td>
                <td class="inviteColumn">{invite.remote_permission? 'remote allowed' : 'no remote'}</td>
                <td class="inviteColumn">{invite.image_permission? 'no images' : 'can post images'}</td>
                <td class="inviteColumn">{invite.expired ? 'expired' : 'active'}</td>
                <td class="inviteColumn">{location.host + '/invite/' + invite.id}</td>
                <td class="accountButtons">
                    <button type="button" class="btn btn-danger" onclick={() => this.deleteInvite(invite.id)}>Delete</button>
                </td>
            </tr>)}
        </table>
        </div>
    }
}
