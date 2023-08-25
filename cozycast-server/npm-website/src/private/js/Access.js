import { h } from 'preact'
import { route } from 'preact-router'
import { DefaultButton } from './DefaultButton.js';
import { InfoScreen } from './InfoScreen.js';
import { useEffect, useState } from 'preact/hooks';

export const Access = ({ code }) => {

    const [state, setState] = useState({
        message: "checking Acess",
        submessage: "please wait",
    })

    useEffect(() => {
        fetch('/api/invite/access/' + code).then((e) => {
            if (e.status != 200)
                setState({ message: "Error", submessage: "Invalid access link" })
            else {
                e.json().then((e) => {
                    route(`/room/${e.name}?access=${code}`, false)
                }
                )
            }
        })
    }, [])

    return (
        <InfoScreen message={state.message} submessage={state.submessage}>
            <div class="inviteButtonContainer">
                <DefaultButton enabled={true} onclick={e => route("/", false)}>
                    exit
                </DefaultButton>
            </div>
        </InfoScreen>
    );
}
