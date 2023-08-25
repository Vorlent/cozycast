import { h } from 'preact';
import { Link } from 'preact-router/match';
import { route } from 'preact-router'
import { AppStateContext } from './appstate/AppStateContext';
import { useContext } from 'preact/hooks';


export const Header = ({ url, logout }) => {
    const { profile, loggedIn, registerWithInviteOnly  } = useContext(AppStateContext);

    return (
        <header class="header">
            <h1>CozyCast</h1>
            {loggedIn.value &&
                <div class={`avatarContainerHeader floatRight inNav ${url == '/profile' ? 'active' : null}`} onclick={() => route('/profile', true)} ><img src={profile.value.avatarUrl} class="avatarImageHeader"></img></div>}
            <nav>
                <Link activeClassName="active" href="/">Rooms</Link>
                {!loggedIn.value &&
                    <Link activeClassName="active" href="/login">Login</Link>
                }
                {loggedIn.value &&
                    <Link activeClassName="active" href="/login" onclick={logout}>Logout</Link>
                }
                {profile.value.admin && loggedIn &&
                    (() => {
                        switch (url) {
                            case '/accounts':
                            case '/invites':
                            case '/permission':
                            case '/cozysettings':
                                return <a class="active" href='/cozysettings'>Admin</a>
                            default:
                                return <a href='/cozysettings'>Admin</a>;
                        }
                    })()
                }
                {!loggedIn.value && !registerWithInviteOnly.value && <Link activeClassName="active" href="/register">Register</Link>}
            </nav>
        </header>
    );
}