import { h, Component } from 'preact'

export class Button extends Component {

    render({ enabled, onclick, children, title, style }, { xyz = [] }) {
        return <button class={`btn ${ style ? style : ''} ${enabled ? 'btn-danger' : 'btn-primary'}`}
                title={title}
                onclick={e => onclick(e)}>
                {children}
            </button>
        ;
    }
}
