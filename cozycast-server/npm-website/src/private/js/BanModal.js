import { h } from 'preact'
import { useContext, useState } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext';


export const BanModal = ({ banTarget, closeModal }) => {

    const [expiration, setExpiration] = useState("unlimited")
    const { sendMessage } = useContext(WebSocketContext);

    const selectExpiration = (e) => {
        setExpiration(e.target.value)
    }

    const banUser = (e) => {
        sendMessage({
            action: 'ban',
            session: banTarget,
            expiration: expiration
        });
        closeBanModal()
    }

    const closeBanModal = () => {
        if (closeModal) closeModal(null);
    }

    return(
    <div class="modal-background">
        <div class="ban modal">
            <div class="title">
                <div>
                    Ban/Kick
                </div>
                <button type="button" class="modal-close" onclick={closeBanModal}>X</button>
            </div>
            <div class="modal-row">
                User: {banTarget}
            </div>
            <div class="modal-row">
                <div class="modal-label">
                    Expiration
                </div>
                <div class="modal-widget">
                    <select value={expiration}
                        onChange={e => selectExpiration(e)}>
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
                <button class="btn btn-primary" onclick={banUser}>Ban User</button>
            </div>
        </div>
    </div>
    )
}
