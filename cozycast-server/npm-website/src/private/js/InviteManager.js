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

    componentDidMount() {
        this.refresh();
    }

    refresh() {
        authFetch("/api/invite/all").then(e => {
            switch (e) {
                case TokenStatus.NO_TOKEN:
                case TokenStatus.EXPIRED:
                    console.log("not logged in");
                    break;
                default:
                    e.json().then(e => {
                        console.log(e);
                        this.setState({ invites: e });
                    });
            }
        });
    }

    deleteInvite(code) {
        authFetch(`/api/invite/${code}`, { method: "DELETE" }).then(() => this.refresh());
    }

    render(_, state) {
        return (
            <div class="default-list-background ">
                <table class="default-list">
                    <thead>
                        <tr>
                            <th>Room</th>
                            <th>Type</th>
                            <th>Expired</th>
                            <th>Uses</th>
                            <th>Remote Permission</th>
                            <th>Image Permission</th>
                            <th>Link</th>
                            <th>Name</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.invites.map(invite => (
                            <tr class="default-list-element">
                                <td>{invite.room}</td>
                                <td>{invite.temporary ? 'Access' : 'Invite'}</td>
                                <td>{invite.expired ? 'Expired' : 'Active'}</td>
                                <td>{invite.uses} / {invite.maxUses ? invite.maxUses : '∞'}</td>
                                <td>{invite.remote_permission ? 'Remote Allowed' : 'No Remote'}</td>
                                <td>{invite.image_permission ? 'Can Post Images' : 'No Images'}</td>
                                <td>{location.protocol + '//' +location.host  + (invite.temporary ? '/access/' : '/invite/') + invite.id}</td>
                                <td>{invite.inviteName ? invite.inviteName : ""}</td>
                                <td>
                                    <DefaultButton enabled={true} onclick={() => this.deleteInvite(invite.id)}>Delete</DefaultButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
}
