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
        dayOfWeek -= 1;
    }
    date.day = dayOfWeek;
    date.hours = hours;
    date.minutes = min;
    return date;
}

function takaTimeFromMinutes(_minutes) {
    var _days = Math.floor(_minutes / (24 * 60));
    _minutes -= _days * 24 * 60;
    var _hours = Math.floor(_minutes / 60);
    _minutes -= 60 * _hours;
    var time = {
        days: _days,
        hours: _hours,
        minutes: _minutes
    };
    return time;
}

function findPattern(time) {
    var str = 'До ограбления ';
    if (time.days % 10 === 1 || (time.hours % 10 === 1 && time.hours !== 11)) {
        str += 'остался ';
    } else if (time.days === 0 && time.hours === 0 &&
            (time.minutes % 10 === 1 && time.minutes !== 11)) {
        str += 'осталась ';
    } else {
        str += 'осталось ';
    }
    if (time.days !== 0) {
        if (time.days === 1) {
            str += '%DD день ';
        } else if (time.days === 2 || time.days === 3 || time.days === 4) {
            str += '%DD дня ';
        } else {
            str += '%DD дней ';
        }
    }
    if (time.hours !== 0) {
        if (time.hours % 10 === 1) {
            str += '%HH час ';
        } else if (time.hours % 10 === 2 && time.hours != 12 ||
                 time.hours % 10 === 3 && time.hours != 13 ||
                 time.hours % 10 === 4 && time.hours != 14) {
            str += '%HH часа ';
        } else {
            str += '%HH часов ';
        }
    }
    if (time.minutes !== 0) {
        if (time.minutes % 10 === 1) {
            str += '%MM минута ';
        } else if (time.minutes % 10 === 2 && time.minutes != 12 ||
                 time.minutes % 10 === 3 && time.minutes != 13 ||
                 time.minutes % 10 === 4 && time.minutes != 14) {
            str += '%MM минуты ';
        } else {
            str += '%MM минут ';
        }
    }
    return str;
}
