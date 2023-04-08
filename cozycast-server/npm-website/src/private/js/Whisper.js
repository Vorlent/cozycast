import { Component,h } from 'preact';

export class Whisper extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userId: '',
            message: ''
        };
    }

    handleInputChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleClick = () => {
        const { userId, message } = this.state;
        if (userId && message) {
            this.props.sendMessage({
                action: 'whisper',
                message: message,
                userId: userId
            });
            this.setState({ userId: '', message: '' });
        }
    }

    render() {
        const { userId, message } = this.state;

        return (
            <div className="message-sender">
                <select
                    value={userId}
                    name="userId"
                    onChange={this.handleInputChange}
                    placeholder="User ID"
                    className="message-sender__input"
                >
                    <option value="" disabled selected>Select User</option>
                    {this.props.userlist.map(user =>
                        <option value={user.session}>{user.username + `(${user.session})`}</option>
                    )}
                </select>
                <input
                    type="text"
                    name="message"
                    value={message}
                    onChange={this.handleInputChange}
                    placeholder="Message"
                    className="message-sender__input"
                />
                <button
                    onClick={this.handleClick}
                    className="message-sender__button"
                >
                    Send Message
                </button>
            </div>
        );
    }
}
