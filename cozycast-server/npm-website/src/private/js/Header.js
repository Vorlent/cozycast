import { h, Component, Fragment } from 'preact';
import { Link } from 'preact-router/match';
import { route } from 'preact-router'


export class Header extends Component {

    render({ url, loggedIn, profile, logout, registerWithInviteOnly }) {
        console.log(this.props)
        return <header class="header">
            <h1>CozyCast</h1>
            {loggedIn && 
                <div class={`avatarContainerHeader floatRight inNav ${url == '/profile' ? 'active' : null}`} onclick={ () => route('/profile',true)} ><img src={profile.avatarUrl} class="avatarImageHeader"></img></div>}
            <nav>
                <Link activeClassName="active" href="/">Rooms</Link>
                {!loggedIn &&
                    <Link activeClassName="active" href="/login">Login</Link>
                }
                {loggedIn &&
                    <Link activeClassName="active" href="/login" onclick={logout}>Logout</Link>
                }
                {profile.admin && loggedIn && 
                    (() => {switch(url){
                        case '/accounts':
                        case '/invites':
                        case '/permission':
                        case '/cozysettings':
                            return <a class="active" href='/cozysettings'>Admin</a>
                        default: 
                            return <a href='/cozysettings'>Admin</a>;
                    }})()
                    }
                {!loggedIn && !registerWithInviteOnly && <Link activeClassName="active" href="/register">Register</Link>}
            </nav>
        </header>
            ;
    }
}