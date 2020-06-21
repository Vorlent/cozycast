import { Component } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'
import { state, updateState, queryParams } from '/js/index.js'
import { sendMessage } from '/js/Room.js'

function closeInvite() {
    updateState(function (state) {
        delete state.inviteModal;
    })
}

export function openInvite(room) {
    updateState(function (state) {
        state.inviteModal = {
            room: room,
            maxUses: null,
            expiration: null
        };
    })
    generateInvite()
}

export function generateInvite() {
    var token = localStorage.getItem("adminToken");
    fetch('/api/invite/new' + queryParams({
            room: state.inviteModal.room,
            maxUses: state.inviteModal.maxUses,
            expiration: state.inviteModal.expiration
        }),
        { headers: { 'Authorization': "Bearer " + token } })
    .then((e) => e.json()).then(function (e) {
        updateState(function (state) {
            state.inviteModal.code = location.host + '/invite/' + e.code
        })
    });
}

function selectMaxUses(e) {
    updateState(function (state) {
        state.inviteModal.maxUses = e.target.value;
    })
    generateInvite()
}

function selectExpiration(e) {
    updateState(function (state) {
        state.inviteModal.expiration = e.target.value;
    })
    generateInvite()
}

export class InviteModal extends Component {

    componentDidUpdate() {
        var codeInput = document.getElementById("invite-modal-code")
        if(codeInput) {
            var end = codeInput.value.length
            codeInput.setSelectionRange(end, end)
        }
    }

    render({ state }, { xyz = [] }) {
        return html`${state.inviteModal && html`
            <div class="modal-background">
                <div class="invite modal">
                    <div class="title">
                        <div>
                            Invite Link
                        </div>
                        <button type="button" class="modal-close" onclick=${closeInvite}>X</button>
                    </div>
                    <div class="modal-row">
                        <div class="modal-label">
                            Max Uses
                        </div>
                        <div class="modal-widget">
                            <select value=${state.inviteModal.maxUses}
                                onChange=${e => selectMaxUses(e)}>
                                <option value="1">1</option>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="${null}">Unlimited</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-row">
                        <div class="modal-label">
                            Expiration
                        </div>
                        <div class="modal-widget">
                            <select value=${state.inviteModal.expiration}
                                onChange=${e => selectExpiration(e)}>
                                 <option value="5">5 minutes</option>
                                 <option value="60">1 hour</option>
                                 <option value="1440">1 day</option>
                                 <option value="${null}">Unlimited</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-row">
                        <input id="invite-modal-code" class="modal-username" type="text"
                            name="code" value="${state.inviteModal.code}"/>
                    </div>
                    <div class="modal-row">
                        <button class="btn btn-primary" onclick=${e => generateInvite()}>Generate</button>
                    </div>
                </div>
        </div>`}`
    }
}
