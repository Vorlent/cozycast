import { Component, render } from '/js/libs/preact.js'
import { html } from '/js/libs/htm/preact/index.js'

import { Button } from '/js/Button.js'

import { SidebarState } from '/js/index.js'

var users = [
    {
        username: "Dandelion 1",
        available: [
            { from: 1, until: 23 }
        ]
    },
    {
        username: "Dandelion 2",
        available: [
            { from: 2, until: 22 }
        ]
    },
    {
        username: "Dandelion 3",
        available: [
            { from: 3, until: 21 }
        ]
    },
    {
        username: "Dandelion 4",
        available: [
            { from: 4, until: 20 }
        ]
    },
    {
        username: "Dandelion 5",
        available: [
            { from: 5, until: 19 }
        ]
    },
]

var tableData = Array.from({ length: 7 }, () => (Array.from({ length: 24 }, ()=> [])))

users.forEach((user) => {
    user.available.forEach((time) => {
        for (var i = time.from; i <= time.until; i++) {
            tableData[0][i].push(user.username)
        }
    })
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

export class ScheduleAvailability extends Component {
    render({ roomId }, { xyz = [] }) {
        return html`
        <div class="availability">
            <div class="title">
                <div>
                    Availability
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th></th>
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
                    ${Array.from(Array(24).keys()).map((hour) => html`
                        <tr>
                            <td>${hour+1}:00</td>
                            ${tableData.map((day) => html`
                                <td><div class="${color(day[hour].length)}">${day[hour].length}</div></td>`)}
                        </tr>`)}
                </tbody>
            </table>
        </div>
        `;
    }
}
