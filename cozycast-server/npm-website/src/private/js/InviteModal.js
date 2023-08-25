import { h } from 'preact'
import { authFetch } from './Authentication.js'
import { useState } from 'preact/hooks'

function queryParams(params) {
    return '?' + Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
}

export const InviteModal = ({ roomId, closeModal }) => {

    const [invite, setInvite] = useState({
        room: roomId,
        maxUses: 1,
        expiration: 5,
        remotePermission: false,
        imagePermission: false,
        inviteName: "",
        temporary: false,
    })

    const [code, setCode] = useState("Press Generate")


    const updateInvite = (e) => {
        setInvite(invite => ({ ...invite, [e.target.name]: e.target.value }))
    }

    const toggleInvite = (e) => {
        setInvite(invite => ({ ...invite, [e.target.name]: !invite[e.target.name] }))
    }

    const closeInvite = () => {
        if (closeModal) closeModal();
    }

    const generateInvite = () => {
        authFetch('/api/invite/new' + queryParams( invite ))
            .then((e) => {
                if (e.status == 401) { return Promise.reject("Unauthorized"); }; e.json().then((e) => {
                    console.log(e)
                    setCode(location.host + (invite.temporary ? '/access/' : '/invite/') + e.code)
                })
            }).catch((error) => setState({ code: 'error: ' + error }));;
    }

    const selectionRange = () => {
        var codeInput = document.getElementById("invite-modal-code")
        if (codeInput) {
            var end = codeInput.value.length
            codeInput.setSelectionRange(end, end)
        }
    }

    return <div class="modal-background">
        <div class="invite modal">
            <div class="title">
                <div>
                    Invite Link
                </div>
                <button type="button" class="modal-close" onclick={closeInvite}>X</button>
            </div>
            <div class="modal-row">
                <input id="temporaryInvite" type="checkbox" checked={invite.temporary} name="temporary"
                    onclick={toggleInvite}></input>
                <label for="temporaryInvite">Temporary</label>
            </div>
            <div class="modal-row">
                <input id="inviteRemotePermission" type="checkbox" checked={invite.remotePermission} name="remotePermission"
                    onclick={toggleInvite}></input>
                <label for="inviteRemotePermission">Allow remote rights</label>
            </div>
            <div class="modal-row">
                <input id="inviteImagePermission" type="checkbox" checked={invite.imagePermission} name="imagePermission"
                    onclick={toggleInvite}></input>
                <label for="inviteImagePermission">Allow image rights</label>
            </div>
            <div class="modal-row">
                <div class="modal-label">
                    Max Uses
                </div>
                <div class="modal-widget">
                    <select value={invite.maxUses}
                        name="maxUses"
                        onChange={updateInvite}>
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
                    <select value={invite.expiration}
                        name="expiration"
                        onChange={updateInvite}>
                        <option value="5">5 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="1440">1 day</option>
                        <option value={null}>Unlimited</option>
                    </select>
                </div>
            </div>
            <div class="modal-row">
                <div class="modal-label">
                    Invite name (optional)
                </div>
                <input id="invite-modal-name" class="modal-username" type="text"
                    name="inviteName" value={invite.inviteName} onInput={updateInvite} />
            </div>
            <div class="modal-row">
                <div class="modal-label">
                    Code
                </div>
                <input id="invite-modal-code" class="modal-username" type="text"
                    name="code" value={code} />
            </div>
            <div class="modal-row">
                <button class="btn btn-primary" onclick={generateInvite}>Generate</button>
            </div>
        </div>
    </div>
}
