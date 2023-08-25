import { h } from 'preact'

export const DefaultButton = ({ enabled, onclick, children, style }) => {

    return (
        <button class={`btn btnStandard ${style ? style : ''} ${enabled ? 'btn-danger' : 'btn-primary'}`}
            onclick={onclick}>
            {children}
        </button>
    );
}
