import { h, Fragment } from 'preact'
import { useState, useEffect } from 'preact/hooks';

export const Clock = ({ startTime }) => {
    const [elapsedTime, setElapsedTime] = useState(Date.now() - startTime);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    const formatElapsedTime = (elapsedTime) => {
        let seconds = Math.floor((elapsedTime / 1000) % 60);
        let minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
        let hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);

        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        return `${hours}:${minutes}:${seconds}`;
    };

    const getStyle = (elapsedTime) => {
        let elapsedTimeSecond = elapsedTime / 1000;
        if (elapsedTimeSecond >= 60 * 60 * 5) {
            return 'holyStyle'; // Class name for holy style
        } else if (elapsedTimeSecond >= 60 * 60 * 4) {
            return 'flashStyle';
        } else if (elapsedTimeSecond >= 60 * 60 * 3) {
            return 'shakeStyle';
        } else if (elapsedTimeSecond >= 60 * 60 * 2) {
            return 'bounceStyle';
        } else if (elapsedTimeSecond >= 60 * 60) {
            return 'pulseBigStyle';
        } else if (elapsedTimeSecond >= 60 * 30) {
            return 'pulseStyle';
        } else {
            return 'baseStyle'; // Default style
        }
    };

    return (
        <span className={"baseStyle " + getStyle(elapsedTime)}> {formatElapsedTime(elapsedTime)}</span>
    );
}    
