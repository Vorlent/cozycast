import { h, Component } from 'preact'

export class DefaultButton extends Component {

    render({ enabled, onclick, children }) {
        return <button class={`btn btnStandard ${enabled ? 'btn-danger' : 'btn-primary'}`}
                onclick={e => onclick(e)}>
                {children}
            </button>
        ;
    }
}
