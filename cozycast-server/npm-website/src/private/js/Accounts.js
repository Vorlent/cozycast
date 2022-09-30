import { h, Component } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'

export class Accounts extends Component {

    constructor(props) {
        super(props);
        this.state = {
            accounts: []
        }
    }

    componentDidMount(){
        this.refresh();
    }

    refresh(){
        authFetch("/api/profile/all").then(e => {
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
                        this.setState(state => {return {accounts: e}})
                    }) 
            }
        }
        )
    }

    deleteUser(username){
        authFetch(`/api/profile/${username}`,{method: "DELETE"}).then(e => this.refresh())
    }

    updateUser(username,admin){
        authFetch(`/api/profile/${username}`,{
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin: !admin
            })
        }).then(e => this.refresh())
    }

    render({profile} , state) {
        return <div class="accountListBackground"><table class="accountList">
            <tr>
                <td></td>
                <td>email</td>
                <td>username</td>
                <td>nickname</td>
                <td>color</td>
                <td>admin</td>
                <td></td>
            </tr>          
            {state.accounts.map(account => 
            <tr class="accountElement">
                <td class="avatarContainerHeader"><img src={account.avatarUrl} class="avatarImageHeader"></img></td>
                <td class="accountName">{account.email}</td>
                <td class="accountName">{account.username}</td>
                <td class="accountName">{account.nickname}</td>
                <td class="accountName">{account.nameColor}</td>
                { account.admin ? <td>admin</td>: <td>Not admin</td>}
                {
                    profile.username != account.username && 
                <td class="accountButtons">
                    <button type="button" class="btn btn-danger" onclick={() => this.updateUser(account.username,account.admin)}>{account.admin ? 'Remove Admin' : 'Make Admin'}</button>
                    <button type="button" class="btn btn-danger" onclick={() => this.deleteUser(account.username)}>{account.admin ? 'Cant delete Admin' : 'Delete'}</button>
                </td>
                }
                {profile.username == account.username && <td></td>}
            </tr>)}
        </table>
        </div>
    }
}
