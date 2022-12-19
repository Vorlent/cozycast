import { Component, h } from 'preact'
import { ProfileModal } from './ProfileModal.js';

export class Profile extends Component {

    render() {
        return <div class="admin-background">
            <ProfileModal profile={this.props.profile} setAppState={this.props.setAppState} updateProfile={this.props.updateProfile} />
        </div>
    }
}