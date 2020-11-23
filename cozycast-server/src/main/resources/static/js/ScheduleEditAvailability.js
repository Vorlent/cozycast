import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { Button } from '/js/Button.js'

import { SidebarState, state, updateState } from '/js/index.js'

var dayOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
var available = [
]

function getHourFromMouse(e, state) {
    return (e.pageY - state.editSchedule.mouseElement.offsetTop) / state.editSchedule.mouseElement.offsetHeight * 24
}

function onCreate(e) {
    var target = e.target
    if(!e.target.classList.contains("selectable")) {
        target = target.parentElement
    }
    updateState(function(state) {
        state.editSchedule.state = "CREATE"
        state.editSchedule.mouseElement = target
        state.editSchedule.currentSelection = {
            from: getHourFromMouse(e, state), until: getHourFromMouse(e, state) + 1
        }
        state.editSchedule.days[target.dataset.day].push(state.editSchedule.currentSelection)
    })
}

function onmousemove(e) {
    if((state.editSchedule.state == "CREATE" || state.editSchedule.state == "RESIZE_BOTTOM")
        && state.editSchedule.mouseElement) {
        updateState(function(state) {
            var until = getHourFromMouse(e, state)
            if(state.editSchedule.currentSelection.from + 1 < until) {
                state.editSchedule.currentSelection.until = until
            } else {
                state.editSchedule.currentSelection.until = state.editSchedule.currentSelection.from + 1
            }
        })
    }

    if(state.editSchedule.state == "RESIZE_TOP" && state.editSchedule.mouseElement) {
        updateState(function(state) {
            var from = getHourFromMouse(e, state)
            if(from + 1 < state.editSchedule.currentSelection.until) {
                state.editSchedule.currentSelection.from = from
            }
        })
    }

    if(state.editSchedule.state == "MOVE" && state.editSchedule.mouseElement) {
        updateState(function(state) {
            var difference = state.editSchedule.currentSelection.until - state.editSchedule.currentSelection.from
            state.editSchedule.currentSelection.from = getHourFromMouse(e, state) - state.editSchedule.moveOffset
            state.editSchedule.currentSelection.until = state.editSchedule.currentSelection.from + difference
        })
    }
}

function onStop(e) {
    if(state.editSchedule.mouseElement) {
        updateState(function(state) {
            state.editSchedule.state = null
            state.editSchedule.currentSelection = null
            state.editSchedule.mouseElement = null
            state.editSchedule.moveOffset = null
        })
    }
}

function onResizeBottom(e) {
    e.stopPropagation();
    var target = e.target.parentElement
    if(!target.classList.contains("range")) {
        return;
    }
    updateState(function(state) {
        state.editSchedule.state = "RESIZE_BOTTOM"
        state.editSchedule.mouseElement = target.parentElement
        state.editSchedule.currentSelection = state.editSchedule.days[target.dataset.day][target.dataset.id]
    })
}

function onResizeTop(e) {
    var target = e.target.parentElement
    e.stopPropagation();
    if(!target.classList.contains("range")) {
        return;
    }
    updateState(function(state) {
        state.editSchedule.state = "RESIZE_TOP"
        state.editSchedule.mouseElement = target.parentElement
        state.editSchedule.currentSelection = state.editSchedule.days[target.dataset.day][target.dataset.id]
    })
}

function onMove(e) {
    var target = e.target.parentElement
    e.stopPropagation();
    if(!target.classList.contains("range")) {
        return;
    }
    updateState(function(state) {
        state.editSchedule.state = "MOVE"
        state.editSchedule.mouseElement = target.parentElement
        state.editSchedule.currentSelection = state.editSchedule.days[target.dataset.day][target.dataset.id]
        state.editSchedule.moveOffset = getHourFromMouse(e, state) - state.editSchedule.currentSelection.from
    })
}


export class ScheduleEditAvailability extends Component {

    componentDidMount() {
        updateState(function(state) {
            state.editSchedule.days = Array.from({ length: 7 }, () => [])
            available.forEach((available) => {
                state.editSchedule.days.forEach((day) => {
                    day.push(available)
                })
            });
        })
    }

    render({ roomId }, { xyz = [] }) {
        return html`
        <div class="edit availability">
            <div class="title">
                <div>
                    Edit Availability
                </div>
            </div>
            <div class="days"
                onmouseleave=${onStop}>
                <div class="day">
                    <div class="header">Time</div>
                </div>
                ${state.editSchedule.days.map((available, day) => html`
                    <div class="day">
                        <div class="header">${dayOfWeek[day]}</div>
                        <div class="selectable"
                            onmousedown=${onCreate}
                            onmousemove=${onmousemove}
                            onmouseup=${onStop}
                            data-day="${day}">
                            ${available.map((range, i) => html`
                                <div class="range"
                                    data-id="${i}"
                                    data-day="${day}"
                                    style="top: ${range.from / 0.24}%; height: ${(range.until - range.from) / 0.24}%;">
                                    <div onmousedown=${onResizeTop}>${Math.round(range.from)}</div>
                                    <div class="body" onmousedown=${onMove}></div>
                                    <div onmousedown=${onResizeBottom}>${Math.round(range.until)}</div>
                                </div>
                            `)}
                        </div>
                    </div>
                `)}
            </div>
        </div>
        `;
    }
}
