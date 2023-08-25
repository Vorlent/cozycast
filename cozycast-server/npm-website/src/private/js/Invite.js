import { h } from 'preact'
import { route } from 'preact-router'
import { authFetch, TokenStatus } from './Authentication.js'
import { DefaultButton } from './DefaultButton.js';
import { InfoScreen } from './InfoScreen.js';
import { useContext, useEffect, useState } from 'preact/hooks';
import { AppStateContext } from './appstate/AppStateContext.js';

export const Invite = ({ code }) => {
    const { inviteCode } = useContext(AppStateContext);

    const [state, setState] = useState({
        message: "checking invite",
        submessage: "please wait",
        validInvite: false
    })


    useEffect(() => {
        authFetch('/api/invite/use/' + code)
            .then((e) => {
                if (e == TokenStatus.EXPIRED || e == TokenStatus.NO_TOKEN) {
                    fetch('/api/invite/check/' + code).then(e => {
                        if (e.status != 200)
                            setState({ message: "Error", submessage: "Invite invlaid or expired" })
                        else {
                            setState({ message: "Not logged in", submessage: "Please log in to use an invite", validInvite: true })
                            inviteCode.value = code;
                        }
                    })

                } else if (e.status == 200) {
                    inviteCode.value = null;
                    setState({ message: "Success", submessage: "Invite used" })
                }
                else {
                    setState({ message: "Invalid invite", submessage: undefined })
                }
            });
    }, []);


    if (!state.validInvite) {
        return (
            <InfoScreen message={state.message} submessage={state.submessage}>
                <DefaultButton enabled={true} onclick={e => route("/", false)}>
                    ok
                </DefaultButton>
            </InfoScreen>
        );
    }
    return (
        <InfoScreen message={state.message} submessage={state.submessage}>
            <div class="inviteButtonContainer">
                <DefaultButton enabled={true} onclick={e => route("/login", false)}>
                    login
                </DefaultButton>
                <DefaultButton enabled={true} onclick={e => route("/register", false)}>
                    register
                </DefaultButton>
            </div>
        </InfoScreen>
    );
}
