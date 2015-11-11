'use strict';
var daysOfWeek = ['ВС','ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
module.exports = function () {
    return {
        set date (str) {
            this._date = parseDateToUTC(str);
        },
        get date () {
            return toStringUTC(this._date, true);
        },

        // Здесь как-то хранится дата ;)
        _date: {},

        // А здесь часовой пояс
        timezone: null,

        // Выводит дату в переданном формате
        format: function (pattern) {
            var correctTimezone = timezoneFormat(this._date.day, this._date.hours, this.timezone);
            var dayIndex = correctTimezone.dayIndex;
            var hours = correctTimezone.hours;
            var minutes = this._date.minutes;
            var day = daysOfWeek[dayIndex];
            hours = formatTime(hours);
            minutes = formatTime(minutes);
            var time = {
                day: day,
                hours: hours,
                minutes: minutes
            };
            return replaceInPattern(pattern, time);
        },

        // Возвращает кол-во времени между текущей датой и переданной `moment`
        // в человекопонятном виде
        fromMoment: function (moment) {
            var thisTimeInMinutes = takeTimeInMinutesUTC(this.date, true);
            var momentInMinutes = takeTimeInMinutesUTC(moment.date, true);
            var difference = thisTimeInMinutes - momentInMinutes;
            if (difference < 0) {
                return 'Ограбление уже идет';
            }
            var differenceObject = takeUTCTimeFromMinutes(difference);
            var correctPattern = findPattern(differenceObject);
            return replaceInPattern(correctPattern, differenceObject);
        }
    };
};

function toStringUTC(date, useIndexOfDay) {
    var str = '';
    var hours = date.hours;
    var minutes = date.minutes;
    hours = formatTime(hours);
    minutes = formatTime(minutes);
    if (useIndexOfDay) {
        str += '0' + date.day;
    } else {
        str = daysOfWeek[date.day];
    }
    str += ' ' + hours + ':' + minutes + '+0';
    return str;
}
module.exports.toStringUTC = toStringUTC;

function timezoneFormat(dayIndex, hours, timezone) {
    hours += timezone;
    if (hours > 23) {
        dayIndex += 1;
    }
    if (hours < 0) {
        hours = 24 + hours;
        dayIndex -= 1;
        if (dayIndex < 0) {
            dayIndex = daysOfWeek.length - 1;
        }
    }
    return {
        dayIndex: dayIndex,
        hours: hours
    };
}

function formatTime(value) {
    if (value < 10) {
        return '0' + value;
    }
    return value;
}
module.exports.formatTime = formatTime;

function replaceInPattern(pattern, time) {
    return pattern.replace(/%DD/g, time.day)
                  .replace(/%HH/g, time.hours)
                  .replace(/%MM/g, time.minutes);
}

function takeTimeInMinutesUTC(str, dayIndex) {
    var date = parseDateToUTC(str, dayIndex);
    var hours = date.day * 24 + date.hours;
    var minutes = hours * 60 + date.minutes;
    return minutes;
};
module.exports.takeTimeInMinutesUTC = takeTimeInMinutesUTC;


function parseDateToUTC(str, DayInIndex) {
    var date = {};
    if (!DayInIndex) {
        var dayOfWeek = daysOfWeek.indexOf(str.slice(0, 2));
    } else {
        var dayOfWeek = parseInt(str.slice(0, 2));
    }
    var timezone = parseInt(str.slice(-2));
    var hours = parseInt(str.slice(3, 5));
    var min = parseInt(str.slice(6, 8));
    var correctTimezone = timezoneFormat(dayOfWeek, hours, -timezone);
    date.day = correctTimezone.dayIndex;
    date.hours = correctTimezone.hours;
    date.minutes = min;
    return date;
}
module.exports.parseDateToUTC = parseDateToUTC;

function takeUTCTimeFromMinutes(minutes) {
    var days = Math.floor(minutes / (24 * 60));
    minutes -= days * 24 * 60;
    var hours = Math.floor(minutes / 60);
    minutes -= 60 * hours;
    var time = {
        day: days,
        hours: hours,
        minutes: minutes
    };
    return time;
}
module.exports.takeUTCTimeFromMinutes = takeUTCTimeFromMinutes;

function findPattern(time) {
    var str = 'До ограбления ';
    if (time.day % 10 === 1 || (time.hours % 10 === 1 && time.hours !== 11)) {
        str += 'остался';
    } else if (time.day === 0 && time.hours === 0 &&
            (time.minutes % 10 === 1 && time.minutes !== 11)) {
        str += 'осталась';
    } else {
        str += 'осталось';
    }
    str += pluralize(time.day, '%DD', ['день', 'дня', 'дней']);
    str += pluralize(time.hours, '%HH', ['час', 'часа', 'часов']);
    str += pluralize(time.minutes, '%MM', ['минута', 'минуты', 'минут']);
    return str + '.';
}

function pluralize(value, type, patterns) {
    var str = ['', type];
    if (value === 0) {
        return '';
    }
    if (value % 10 === 1) {
        str.push(patterns[0]);
    } else if (value % 10 === 2 && value !== 12 ||
             value % 10 === 3 && value !== 13 ||
             value % 10 === 4 && value !== 14) {
        str.push(patterns[1]);
    } else {
        str.push(patterns[2]);
    }
    return str.join(' ');
}
