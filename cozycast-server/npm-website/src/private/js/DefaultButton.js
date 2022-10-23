import { h, Component } from 'preact'

export class DefaultButton extends Component {

    render({ enabled, onclick, children,style }) {
        return <button class={`btn btnStandard ${ style ? style : ''} ${enabled ? 'btn-danger' : 'btn-primary'}`}
                onclick={e => onclick(e)}>
                {children}
            </button>
        ;
    }
}
