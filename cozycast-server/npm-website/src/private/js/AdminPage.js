import { h, Component } from 'preact';
import { Router,route } from 'preact-router';
import { Link } from 'preact-router/match';
import { Accounts } from './Accounts';
import { InviteManager } from './InviteManager';
import { PermissionManager } from './PermissionManager';
import { MiscSettings } from './MiscSettings';

export class AdminPage extends Component {

    render(props,state) {
        if(!this.props.profile.admin){
            route('/', true);
        }
        return (
            <div class="admin-page-background">
                <header id="admin-page-header" class="header">
                    <nav>
                    <Link activeClassName="active" href="/cozysettings">Settings</Link>
                    <Link activeClassName="active" href="/accounts">Accounts</Link>
                    <Link activeClassName="active" href="/permission">Permissions</Link>
                    <Link activeClassName="active" href="/invites">Invites</Link>
                    </nav>
                </header>
                <div class="admin-page-content">
                    <Router>
                        <Accounts path="/accounts" profile={props.profile} />
                        <InviteManager path="/invites" profile={props.profile} />
                        <PermissionManager path="/permission" />
                        <MiscSettings
                            path="/cozysettings"
                            message={props.message}
                            registerWithInviteOnly={props.registerWithInviteOnly}
                            updateMisc={props.updateMisc}
                        />
                    </Router>
                </div>
            </div>
        );
    }
}
