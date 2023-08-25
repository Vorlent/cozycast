import { h } from 'preact';
import { Router,route } from 'preact-router';
import { Link } from 'preact-router/match';
import { Accounts } from './Accounts';
import { InviteManager } from './InviteManager';
import { PermissionManager } from './PermissionManager';
import { MiscSettings } from './MiscSettings';
import { AppStateContext } from './appstate/AppStateContext';
import { useContext } from 'preact/hooks';

export const AdminPage = ({refreshMisc}) => {
    const {profile} = useContext(AppStateContext);
    if(!(profile.value.admin)) {
        route('/', true);
        return;
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
                    <Accounts path="/accounts"/>
                    <InviteManager path="/invites"/>
                    <PermissionManager path="/permission"/>
                    <MiscSettings path="/cozysettings" refreshMisc={refreshMisc}/>
                </Router>
            </div>
        </div>
    );
}
