import { TimerStore } from "./types/types";

/**
 * Store the timers for each room
 * Example of timerStore object
 * {
 * [roomName]:{
 *    timer: setInterval(),
 *    users:[socket.data.nickname, socket.data.nickname, socket.data.nickname]]
 * 	  timerButtons: number[],
 *    secondsRemaining: number,
 *    isPaused: boolean,
 * 	  isBreak: boolean,
 *    destroyTimer?: setTimeout() // optional: Only set if there are no users in the room at any given time
 *    originalDuration: number // Original duration of the timer in seconds for resetting the timer
 *    }
 *    ......
 * }
 */

export default {} as TimerStore;
