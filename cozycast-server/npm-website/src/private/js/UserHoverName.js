import { h } from 'preact'

export const UserHoverName = ({ hoverText }) => {
    if (hoverText.value) {
        const { y, x, isActive, pos, text } = hoverText.value;
        return (
            <div style={{ top: y + 'px', left: x + 'px', '--onlineStatus': isActive ? '#199239' : '#e6c714', }} class={`hoverInfoScript ${pos}`}>
                {text}
            </div>);
    }
}