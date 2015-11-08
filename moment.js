'use strict';

module.exports = function () {
    var daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    return {
        set date (str) {
            this._date = parseDateToUTC(str);
        },
        get date () {
            var str = '';
            var hours = this._date.hours;
            var minutes = this._date.minutes;
            if (hours < 10) {
                hours = '0' + hours;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            str += '0' + this._date.day + ' ' + hours + ':' + minutes + '+0';
            return str;
        },

        // Здесь как-то хранится дата ;)
        _date: {},

        // А здесь часовой пояс
        timezone: null,

        // Выводит дату в переданном формате
        format: function (pattern) {
            var dayIndex = this._date.day;
            var hours = this._date.hours + this.timezone;
            var minutes = this._date.minutes;
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
            var day = daysOfWeek[dayIndex];
            if (hours < 10) {
                hours = '0' + hours;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            var time = {
                days: day,
                hours: hours,
                minutes: minutes
            };
            return replaceInPattern(pattern, time);
        },

        // Возвращает кол-во времени между текущей датой и переданной `moment`
        // в человекопонятном виде
        fromMoment: function (moment) {
            var thisTimeInMinutes = takeTimeInMinutesUTC(this.date);
            var momentInMinutes = takeTimeInMinutesUTC(moment.date);
            var difference = thisTimeInMinutes - momentInMinutes;
            if (difference < 0) {
                return 'Ограбление уже идет';
            }
            var differenceObject = takaTimeFromMinutes(difference);
            var correctPattern = findPattern(differenceObject);
            return replaceInPattern(correctPattern, differenceObject);
        }
    };
};


function replaceInPattern(pattern, time) {
    pattern = pattern.replace(/%DD/g, time.days);
    pattern = pattern.replace(/%HH/g, time.hours);
    pattern = pattern.replace(/%MM/g, time.minutes);
    return pattern;
}

function takeTimeInMinutesUTC(str) {
    var date = parseDateToUTC(str, true);
    var hours = date.day * 24 + date.hours;
    var minutes = hours * 60 + date.minutes;
    return minutes;
};

function parseDateToUTC(str, DayInIndex) {
    var daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    var date = {};
    if (!DayInIndex) {
        var dayOfWeek = daysOfWeek.indexOf(str.slice(0, 2));
    } else {
        var dayOfWeek = parseInt(str.slice(0, 2));
    }
    var timezone = parseInt(str.slice(-2));
    var hours = parseInt(str.slice(3, 5));
    var min = parseInt(str.slice(6, 8));
    hours -= timezone;
    if (hours < 0) {
        hours = 24 + hours;
        dayOfWeek -= 1;
    }
    date.day = dayOfWeek;
    date.hours = hours;
    date.minutes = min;
    return date;
}

function takaTimeFromMinutes(minutes) {
    var days = Math.floor(minutes / (24 * 60));
    minutes -= days * 24 * 60;
    var hours = Math.floor(minutes / 60);
    minutes -= 60 * hours;
    var time = {
        days: days,
        hours: hours,
        minutes: minutes
    };
    return time;
}

function findPattern(time) {
    var str = 'До ограбления ';
    if (time.days % 10 === 1 || (time.hours % 10 === 1 && time.hours !== 11)) {
        str += 'остался';
    } else if (time.days === 0 && time.hours === 0 &&
            (time.minutes % 10 === 1 && time.minutes !== 11)) {
        str += ' осталась';
    } else {
        str += ' осталось';
    }
    str += pluralize(time.days, '%DD', ['день', 'дня', 'дней']);
    str += pluralize(time.hours, '%HH', ['час', 'часа', 'часов']);
    str += pluralize(time.minutes, '%MM', ['минута', 'минуты', 'минут']);
    return str + '.';
}

function pluralize(value, type, patterns) {
    var str = '';
    if (value !== 0) {
        if (value % 10 === 1) {
            str += ' ' + type + ' ' + patterns[0];
        } else if (value % 10 === 2 && value !== 12 ||
                 value % 10 === 3 && value !== 13 ||
                 value % 10 === 4 && value !== 14) {
            str += ' ' + type + ' ' + patterns[1];
        } else {
            str += ' ' + type + ' ' + patterns[2];
        }
    }
    return str;
}
