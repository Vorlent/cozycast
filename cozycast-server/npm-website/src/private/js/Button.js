import { h } from 'preact'

export const Button = ({ enabled, onclick, children, title, style }) => {

    return (<button type="button" tabindex="0" class={`btn ${style ? style : ''} ${enabled ? 'btn-danger' : 'btn-primary'}`}
        title={title}
        onclick={e => onclick(e)}>
        {children}
    </button>
    );
}
