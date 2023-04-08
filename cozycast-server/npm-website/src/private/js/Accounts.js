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
        authFetch('/api/profile/all').then((e) => {
            switch (e) {
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    console.log('not logged in');
                    break;
                default:
                    e.json().then((e) => {
                        console.log(e);
                        this.setState((state) => ({ accounts: e }));
                    });
            }
        });
    }

    deleteUser(username) {
        if(confirm("Are you sure you want to delete " + username)){
            authFetch(`/api/profile/${username}`, { method: "DELETE" }).then(e => this.refresh())
        }
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
        return (
            <div class="default-list-background">
                <table class="default-list">
                    <tr>
                        <th>Avatar</th>
                        <th>Username</th>
                        <th>Nickname</th>
                        <th>Color</th>
                        <th class="default-list-table-center">Verified</th>
                        <th class="default-list-table-center">Admin</th>
                        <th class="default-list-table-center">Delete</th>
                    </tr>
                    <tbody>
                        {state.accounts.map((account) => (
                            <tr class="default-list-element">
                                <td class="default-list-avatar-container-header">
                                    <img src={account.avatarUrl} class="default-list-avatar-image-header"></img>
                                </td>
                                <td class="default-list-name">{account.username}</td>
                                <td class="default-list-nickname">{account.nickname}</td>
                                <td class="default-list-color">
                                    <span style={{ backgroundColor: account.nameColor, width: '10px', height: '10px', display: 'inline-block', marginRight: '5px', borderRadius: '2px' }}></span>
                                    {account.nameColor}
                                </td>

                                <td class="default-list-table-center">
                                    <DefaultButton
                                        enabled={account.verified}
                                        onclick={() => this.updateUser(account.username, account.admin, !account.verified)}
                                    >
                                        {account.verified ? 'verified' : 'Not verified'}
                                    </DefaultButton>
                                </td>
                                {profile.username != account.username && (
                                    <Fragment>
                                        <td class="default-list-table-center">
                                            <DefaultButton
                                                enabled={account.admin}
                                                onclick={() => this.updateUser(account.username, !account.admin, account.verified)}
                                            >
                                                {account.admin ? 'Remove Admin' : 'Make Admin'}
                                            </DefaultButton>
                                        </td>
                                        <td class="default-list-table-center">
                                            <DefaultButton
                                                enabled={!account.admin}
                                                onclick={() => this.deleteUser(account.username)}
                                            >
                                                {account.admin ? "Disabled" : 'Delete'}
                                            </DefaultButton>
                                        </td>
                                    </Fragment>
                                )}
                                {profile.username == account.username && (
                                    <Fragment>
                                        <td class="default-list-table-center">(you)</td>
                                        <td class="default-list-table-center">(you)</td>
                                    </Fragment>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
}
