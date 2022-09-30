import { h, Component, Fragment } from 'preact';
import { Link } from 'preact-router/match';
import { route } from 'preact-router'


export class Header extends Component {

    render({loggedIn,profile}) {
        return <header class="header">
            <h1>CozyCast</h1>
            {loggedIn && <div class="avatarContainerHeader floatRight inNav" onclick={ () => route('/profile',true)} ><img src={profile.avatarUrl} class="avatarImageHeader"></img></div>}
            <nav>
                <Link activeClassName="active" href="/">Rooms</Link>
                <Link activeClassName="active" href="/login">{loggedIn ? "Logout" : "Login"}</Link>
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