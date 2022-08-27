import { Component, h } from 'preact'
import { queryParams } from './index.js'

export class InviteModal extends Component {
    constructor(props){
        super(props);
        this.state = {
            room: this.props.roomId,
            maxUses: null,
            expiration: null,
            code: "Press Generate"
        }
    }

    selectMaxUses = (e) => {
        this.setState({
            maxUses: e.target.value
        })
    }
    
    selectExpiration = (e) => {
        this.setState({
            expiration: e.target.value
        })
    }

    closeInvite = () => {
        this.setState({
            maxUses: null,
            expiration: null,
        })
        this.props.updateSettingsState({
            inviteModal: false
        })
    }

    generateInvite = () => {
        var token = localStorage.getItem("adminToken");
        fetch('/api/invite/new' + queryParams({
                room: this.state.room,
                maxUses: this.state.maxUses,
                expiration: this.state.expiration
            }),
            { headers: { 'Authorization': "Bearer " + token } })
        .then((e) => {if(e.status == 401){return Promise.reject("Unauthorized");}; e.json().then((e) => {
                console.log(e)
                this.setState({
                    code: location.host + '/invite/' + e.code
                })
        })}).catch((error) => this.setState({code: 'error: ' + error}));;
    }

    componentDidUpdate() {
        var codeInput = document.getElementById("invite-modal-code")
        if(codeInput) {
            var end = codeInput.value.length
            codeInput.setSelectionRange(end, end)
        }
    }

    render({ state }, { xyz = [] }) {
        return <div class="modal-background">
                <div class="invite modal">
                    <div class="title">
                        <div>
                            Invite Link
                        </div>
                        <button type="button" class="modal-close" onclick={this.closeInvite}>X</button>
                    </div>
                    <div class="modal-row">
                        <div class="modal-label">
                            Max Uses
                        </div>
                        <div class="modal-widget">
                            <select value={this.state.maxUses}
                                onChange={e => this.selectMaxUses(e)}>
                                <option value="1">1</option>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value={null}>Unlimited</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-row">
                        <div class="modal-label">
                            Expiration
                        </div>
                        <div class="modal-widget">
                            <select value={this.state.expiration}
                                onChange={e => this.selectExpiration(e)}>
                                 <option value="5">5 minutes</option>
                                 <option value="60">1 hour</option>
                                 <option value="1440">1 day</option>
                                 <option value={null}>Unlimited</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-row">
                        <input id="invite-modal-code" class="modal-username" type="text"
                            name="code" value={this.state.code}/>
                    </div>
                    <div class="modal-row">
                        <button class="btn btn-primary" onclick={e => this.generateInvite()}>Generate</button>
                    </div>
                </div>
        </div>
    }
}
