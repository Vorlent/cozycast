import { h, Component, Fragment } from 'preact';
import { Link } from 'preact-router/match';
import { route } from 'preact-router'


export class Header extends Component {

    render({ loggedIn, profile, logout }) {
        return <header class="header">
            <h1>CozyCast</h1>
            {loggedIn && <div class="avatarContainerHeader floatRight inNav" onclick={ () => route('/profile',true)} ><img src={profile.avatarUrl} class="avatarImageHeader"></img></div>}
            <nav>
                <Link activeClassName="active" href="/">Rooms</Link>
                {!loggedIn &&
                    <Link activeClassName="active" href="/login">Login</Link>
                }
                {loggedIn &&
                    <Link activeClassName="active" href="/login" onclick={logout}>Logout</Link>
                }
                {profile.admin && loggedIn && 
                <Fragment>
                    <Link activeClassName="active" href="/accounts">Accounts</Link>
                    <Link activeClassName="active" href="/invites">Invites</Link>
                    <Link activeClassName="active" href="/permission">Permission</Link>
                    </Fragment>}
                {!loggedIn && <Link activeClassName="active" href="/register">Register</Link>}
            </nav>
        </header>
            ;
    }
}