import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { ScheduleAvailability } from '/js/ScheduleAvailability.js'
import { ScheduleEditAvailability } from '/js/ScheduleEditAvailability.js'
import { ScheduleCalendar } from '/js/ScheduleCalendar.js'
import { Button } from '/js/Button.js'

import { SidebarState, state, updateState } from '/js/index.js'


export function openSchedule() {
    updateState(function (state) {
        state.scheduleSidebar = !state.scheduleSidebar
    })
}

function selectScheduleMenu(name) {
    updateState(function (state) {
        state.scheduleMenu = name
    })
}

export class ScheduleSidebar extends Component {
    render({ roomId }, { xyz = [] }) {
        return html`
            <div id="schedule">
                <div class="navigation">
                    <${Button} enabled=${state.scheduleMenu == "ROOM_AVAILABILITY"}
                        onclick=${() => selectScheduleMenu("ROOM_AVAILABILITY")}>
                        Room Availability
                    <//>
                    <${Button} enabled=${state.scheduleMenu == "ROOM_SCHEDULE"}
                        onclick=${() => selectScheduleMenu("ROOM_SCHEDULE")}>
                        Room Calendar
                    <//>
                    <${Button} enabled=${state.scheduleMenu == "EDIT_AVAILABILITY"}
                        onclick=${() => selectScheduleMenu("EDIT_AVAILABILITY")}>
                        Edit Availability
                    <//>
                </div>
                <div class="content">
                    ${state.scheduleMenu == "ROOM_AVAILABILITY"
                        && html`<${ScheduleAvailability} state=${state}/>`}
                    ${state.scheduleMenu == "ROOM_SCHEDULE"
                        && html`<${ScheduleCalendar} state=${state}/>`}
                    ${state.scheduleMenu == "EDIT_AVAILABILITY"
                        && html`<${ScheduleEditAvailability} state=${state}/>`}
                </div>
            </div>
        `;
    }
}
