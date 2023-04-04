import { h, Component } from 'preact'


export class BanModal extends Component {
    constructor(props){
        super(props);
        this.state = {
            expiration: "unlimited",
            selectedUser: props.banTarget
        }
    }
    
    selectExpiration = (e) => {
        this.setState({expiration: e.target.value})
    }
    
    banUser(e) {
        this.props.sendMessage({
            action : 'ban',
            session: this.state.selectedUser,
            expiration: this.state.expiration
        });
        this.closeBanModal()
    }

    closeBanModal = () => {
        this.setState({
            expiration: "unlimited",
            selectedUser: null
        })
        this.props.updateSettingsState({
            banModal: false
        })
    }

    render({ state }, { xyz = [] }) {
        return <div class="modal-background">
                <div class="ban modal">
                    <div class="title">
                        <div>
                            Ban/Kick
                        </div>
                        <button type="button" class="modal-close" onclick={this.closeBanModal}>X</button>
                    </div>
                    <div class="modal-row">
                        User: {this.state.selectedUser}
                    </div>
                    <div class="modal-row">
                        <div class="modal-label">
                            Expiration
                        </div>
                        <div class="modal-widget">
                            <select value={this.state.expiration}
                                onChange={e => this.selectExpiration(e)}>
                                 <option value="0">Refresh</option>
                                 <option value="10">10 minutes</option>
                                 <option value="60">1 hour</option>
                                 <option value="1440">1 day</option>
                                 <option value="10080">1 week</option>
                                 <option value="43200">1 month</option>
                                 <option value="unlimited">Unlimited</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-row">
                        <button class="btn btn-primary" onclick={e => this.banUser()}>Ban User</button>
                    </div>
                </div>
        </div>
    }
}
