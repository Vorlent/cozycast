import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState, queryParams } from '/js/index.js'
import { sendMessage } from '/js/Room.js'
import { Userlist } from '/js/Userlist.js'

function closeBanModal() {
    updateState(function (state) {
        delete state.banModal;
    })
}

export function openBanModal(room) {
    updateState(function (state) {
        state.banModal = {
            room: room,
            expiration: "unlimited",
            selectedUser: null
        };
    })
}

function selectUser(e) {
    updateState(function (state) {
        state.banModal.selectedUser = e.target.value
    })
}

function selectExpiration(e) {
    updateState(function (state) {
        state.banModal.expiration = e.target.value
    })
}

function banUser(e) {
    var token = localStorage.getItem("adminToken");
    sendMessage({
    	action : 'ban',
        token: state.roomToken,
        session: state.banModal.selectedUser,
        expiration: state.banModal.expiration
    });
    closeBanModal()
}


export class BanModal extends Component {

    render({ state }, { xyz = [] }) {
        return html`${state.banModal && html`
            <div class="modal-background">
                <div class="ban modal">
                    <div class="title">
                        <div>
                            Ban User
                        </div>
                        <button type="button" class="modal-close" onclick=${closeBanModal}>X</button>
                    </div>
                    <div class="modal-row">
                        <div class="modal-label">
                            User
                        </div>
                        <select id="settings-desktop-resolution"
                            value=${state.banModal.selectedUser}
                            onChange=${e => selectUser(e)}>

                          <option value="null">Select a User</option>
                          ${state.userlist.map(user => html`
                              <option value="${user.session}">${user.username}</option>
                          `)}
                        </select>
                    </div>
                    <div class="modal-row">
                        <div class="modal-label">
                            Expiration
                        </div>
                        <div class="modal-widget">
                            <select value=${state.banModal.expiration}
                                onChange=${e => selectExpiration(e)}>
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
                        <button class="btn btn-primary" onclick=${e => banUser()}>Ban User</button>
                    </div>
                </div>
        </div>`}`
    }
}
