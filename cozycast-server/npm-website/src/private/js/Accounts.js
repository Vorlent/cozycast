import { h, Component, Fragment } from 'preact'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js';

export class Accounts extends Component {

    constructor(props) {
        super(props);
        this.state = {
            accounts: []
        }
    }

    componentDidMount() {
        this.refresh();
    }

    refresh() {
        authFetch("/api/profile/all").then(e => {
            switch (e) {
                case TokenStatus.NO_TOKEN:
                    console.log("not logged in")
                    break;
                case TokenStatus.EXPIRED:
                    console.log("not logged in")
                    break;
                default:
                    e.json().then(e => {
                        console.log(e);
                        this.setState(state => { return { accounts: e } })
                    })
            }
        }
        )
    }

    deleteUser(username) {
        authFetch(`/api/profile/${username}`, { method: "DELETE" }).then(e => this.refresh())
    }

    updateUser(username, admin, verified) {
        authFetch(`/api/profile/${username}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin: admin,
                verified: verified
            })
        }).then(e => this.refresh())
    }

    render({ profile }, state) {
        return <div class="accountListBackground">
            <table class="accountList">
                <tr>
                    <td></td>
                    <td>username</td>
                    <td>nickname</td>
                    <td>color</td>
                    <td class="tableCenter">verified</td>
                    <td class="tableCenter">admin</td>
                    <td class="tableCenter">delete</td>
                </tr>
                {state.accounts.map(account =>
                    <tr class="accountElement">
                        <td class="avatarContainerHeader"><img src={account.avatarUrl} class="avatarImageHeader"></img></td>
                        <td class="accountName">{account.username}</td>
                        <td class="accountName">{account.nickname}</td>
                        <td class="accountName">{account.nameColor}</td>
                        <td class="tableCenter" ><DefaultButton enabled={account.verified} onclick={() => this.updateUser(account.username, account.admin, !account.verified)}>
                            {account.verified ? "verified" : "Not verified"}</DefaultButton>
                        </td>
                        {
                            profile.username != account.username &&
                            <Fragment>
                                <td class="tableCenter">
                                    <DefaultButton enabled={account.admin} onclick={() => this.updateUser(account.username, !account.admin, account.verified)}>{account.admin ? 'Remove Admin' : 'Make Admin'}</DefaultButton>
                                </td>
                                <td class="tableCenter">
                                    <DefaultButton enabled={!account.admin} onclick={() => this.deleteUser(account.username)}>{account.admin ? 'Cant delete Admin' : 'Delete'}</DefaultButton>
                                </td>
                            </Fragment>

                        }
                        {profile.username == account.username && <Fragment><td class="tableCenter" >(you)</td><td class="tableCenter">(you)</td></Fragment>}
                    </tr>)}
            </table>
        </div>
    }
}
