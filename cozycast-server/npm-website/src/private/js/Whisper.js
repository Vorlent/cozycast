import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { WebSocketContext } from './websocket/WebSocketContext';
import { useSignal } from '@preact/signals';

export const Whisper = () => {
    const { userlist,sendMessage } = useContext(WebSocketContext)
    const message = useSignal ('');
    const userId = useSignal(null);

    const handleClick = () => {
        console.log(message.value, userId.value);
        if (userId.value && message.value) {
            sendMessage({
                action: 'whisper',
                message: message.value,
                userId: userId.value
            });
            message.value = '';
        }
    }

        return (
            <div className="message-sender">
                <select
                    value={userId}
                    name="userId"
                    onChange={e => {userId.value = e.target.value}}
                    placeholder="User ID"
                    className="message-sender__input"
                >
                    <option value="" disabled selected>Select User</option>
                    {userlist.value.map(user =>
                        <option value={user.session}>{user.username + `(${user.session})`}</option>
                    )}
                </select>
                <input
                    type="text"
                    name="message"
                    value={message}
                    onChange={e => {message.value = e.target.value}}
                    placeholder="Message"
                    className="message-sender__input"
                />
                <button
                    onClick={handleClick}
                    className="message-sender__button"
                >
                    Send Message
                </button>
            </div>
        );
}
