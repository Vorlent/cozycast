import { Component, h } from 'preact'


export function showHover(e,name,pos,showUsername,isActive,setState){
    if(pos =='top' && showUsername) return;
    let box = e.target.getBoundingClientRect();
    if(pos == 'top'){
        setState({
            hoverText: {
                text: name,
                isActive: isActive,
                x: Math.round(box.x) + box.width/2,
                y: Math.round(box.y) - box.width/2 * 1.1,
                pos: 'top'}
        })
    } else if (pos == 'right'){
        setState({
            hoverText: {
                text: name,
                isActive: isActive,
                x: Math.round(box.x) + box.width * 1.1,
                y: Math.round(box.y) + box.width/2,
                pos: 'right'}
        })
        }
}

export function hideHover(setState){
    setState({
        hoverText: undefined
    })
}

export class UserHoverName extends Component {

    render({ state }) {
        return <div style={{top: state.hoverText.y+'px', left: state.hoverText.x+'px', '--onlineStatus': state.hoverText.isActive ? '#199239' : '#e6c714',}} class={`hoverInfoScript ${state.hoverText.pos}`}>
                {state.hoverText.text}
            </div>;
    }
}