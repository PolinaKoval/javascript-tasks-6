'use strict';
var daysOfWeek = ['СБ', 'ВС','ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];
/** Создает новый объект времени
 * @constructor
 * @this {Moment}
 * @returns {Moment} экземпляр объекта времени
 */
module.exports = function () {
    return {
        set date (str) {
            this._date = parseDateToUTC(str);
        },
        get date () {
            return toStringUTC(this._date, true);
        },
        _date: {},
        timezone: null,

        /** Выводит дату в переданном формате
         * @param {string} pattern фомат для вывода
         * @returns {string} переданный формат с текущей датой
        */
        format: function (pattern) {
            var correctTimezone = timezoneFormat(this._date.day, this._date.hours, this.timezone);
            correctTimezone.hours = formatTime(correctTimezone.hours);
            correctTimezone.minutes = formatTime(this._date.minutes);
            return replaceInPattern(pattern, correctTimezone);
        },
        /** Возвращает кол-во времени между текущей датой и переданной `moment`
         с учетом правил русского языка
         * @param {Moment} moment дата отсчета
         * @returns {string} кол-во времени между текущей датой и переданной
        */
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


/** Переводит объект времени в строку
 * @param {Object} date дата
 * @param {bool} [useIndexOfDay=false] показывать отображать ли день в виде индекса
 * @returns {string} информация о времени
 */
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


/** Корректирует день и часы с учетом часового пояса
 * @param {number} dayIndex индекс дня
 * @param {number} hours часы
 * @param {number} timezone сдвиг времени
 * @returns {Object} объект с новыми днем и часами
 */
function timezoneFormat(dayIndex, hours, timezone) {
    hours += timezone;
    if (hours > 23) {
        hours -= 24;
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
        day: daysOfWeek[dayIndex],
        hours: hours
    };
}

/** Добавляет при необходимости ведущий ноль
 * @param {number|string} value значение
 * @returns {string} значение с ведущим нулем
 */
function formatTime(value) {
    if (value < 10) {
        return '0' + value;
    }
    return value;
}
module.exports.formatTime = formatTime;

/** Подставляет дату в переданный формат
 * @param {number|string} value значение
 * @returns {string} значение с ведущим нулем
 */
function replaceInPattern(pattern, time) {
    return pattern.replace(/%DD/g, time.day)
                  .replace(/%HH/g, time.hours)
                  .replace(/%MM/g, time.minutes);
}

/** Получает время в UTC минутах из строки
 * @param {string} str строка с датой
 * @param {dayIndex} dayIndex показывает использован во входной строке индекс
 дня или обозначение вида ПН
 * @returns {number} количество минут в UTC зоне
 */
function takeTimeInMinutesUTC(str, dayIndex) {
    var date = parseDateToUTC(str, dayIndex);
    var hours = date.day * 24 + date.hours;
    var minutes = hours * 60 + date.minutes;
    return minutes;
};
module.exports.takeTimeInMinutesUTC = takeTimeInMinutesUTC;

/** Превращает строку в объект даты в часовом поясе UTC
 * @param {string} str строка с датой
 * @param {dayIndex} dayInIndex показывает использован во входной строке индекс
 дня или обозначение вида ПН
 * @returns {Object} объект даты
 */
function parseDateToUTC(str, dayInIndex) {
    var date = {};
    if (!dayInIndex) {
        var dayOfWeek = daysOfWeek.indexOf(str.slice(0, 2));
    } else {
        var dayOfWeek = parseInt(str.slice(0, 2));
    }
    var timezone = parseInt(str.slice(8));
    var hours = parseInt(str.slice(3, 5));
    var min = parseInt(str.slice(6, 8));
    var correctTimezone = timezoneFormat(dayOfWeek, hours, -timezone);
    date.day = daysOfWeek.indexOf(correctTimezone.day);
    date.hours = correctTimezone.hours;
    date.minutes = min;
    return date;
}
module.exports.parseDateToUTC = parseDateToUTC;

/** Конвертирует минуты в объект с временем UTC
 * @param {number} minutes количество минут
 * @returns {Object} объект с временем UTC
 */
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

/** Находит формат вывода для времени
 * @param {Object} time объект времени
 * @returns {string} найденный формат
 */
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

/** Выбирает правильную форму слова из patterns в соответсвие с value
 * @param {number} value значение
 * @param {string} type тип значения
 * @returns {Array} patterns массив слов
 */
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
