import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { Button } from '/js/Button.js'

import { SidebarState} from '/js/index.js'

var events = [
    {
        name: "TV",
        day: "MON",
        time: "13:00",
        location: "https://example.com/"
    },
    {
        name: "TV 2",
        day: "MON",
        time: "14:00",
        location: "https://example.com/"
    },
    {
        name: "Games",
        day: "TUE",
        time: "15:00",
        location: "https://example.com/"
    },
    {
        name: "Music",
        day: "WED",
        time: "19:00",
        location: "https://example.com/"
    }
]

var eventsByDay = {
    MON: [],
    TUE: [],
    WED: [],
    THU: [],
    FRI: [],
    SAT: [],
    SUN: []
}

events.forEach((event) => {
    eventsByDay[event.day].push(event)
});

function color(usercount) {
    if(usercount >= 5) {
        return "many"
    }
    if(usercount >= 3) {
        return "few"
    }
    if(usercount >= 1) {
        return "one"
    }
    return "none"
}

function addEvent(day) {
    console.log(day)
}

export class ScheduleCalendar extends Component {
    render({ roomId }, { xyz = [] }) {
        return html`
        <div class="calendar">
            <div class="title">
                <div>
                    Calendar
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Monday</th>
                        <th>Tuesday</th>
                        <th>Wednesday</th>
                        <th>Thursday</th>
                        <th>Friday</th>
                        <th>Saturday</th>
                        <th>Sunday</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${Object.values(eventsByDay).map((day) => html`
                            <td><div>
                                ${day.map((event) => html`
                                    <div class="entry none">${event.name}</div>
                                `)}
                                <div class="entry">
                                    <${Button} onclick=${() => addEvent(day)}>Add<//>
                                </div>
                            </div></td>`)}
                    </tr>
                </tbody>
            </table>
        </div>
        `;
    }
}
