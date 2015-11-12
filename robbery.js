'use strict';
var DAYS_OF_WEEK = ['СБ', 'ВС','ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];
var bankTimezone = 0;
var moment = require('./moment');

/** Выбирает подходящий ближайший момент начала ограбления
 * @param {json} json информация о занятости
 * @param {number} minDuration продолжительность ограбления
 * @param {Object} workingHours часы работы банка
 * @returns {Moment} момент начала ограбления
 */
module.exports.getAppropriateMoment = function (json, minDuration, workingHours) {
    var appropriateMoment = moment();
    var data = JSON.parse(json);
    bankTimezone = parseInt(workingHours.from.slice(5));
    var dataInMinutes = convertTimeObjectToMinutesUTC(data);
    var freeTime = reversTime(dataInMinutes);
    freeTime.bank = bankTimeInMinutes(workingHours);
    var intersection = findIntersection(freeTime, minDuration);
    if (!intersection) {
        return appropriateMoment;
    }
    var robberyTime = takeStringTimeFromMinutes(intersection.from);
    appropriateMoment.date = robberyTime;
    appropriateMoment.timezone = bankTimezone;
    return appropriateMoment;
};

/** Возвращает статус ограбления
 * @param {moment} moment момент, для которого ищется статус
 * @param {moment} robberyMoment момент ограбления
 * @returns {string} информация о статусе
 */
module.exports.getStatus = function (moment, robberyMoment) {
    if (moment.date < robberyMoment.date) {
        // «До ограбления остался 1 день 6 часов 59 минут»
        return robberyMoment.fromMoment(moment);
    }
    return 'Ограбление уже идёт!';
};

/** Возвращает новый объект отрезка времени
 * @param {number|string} from время начала отрезка времени
 * @param {number|string} to время конца отрезка времени
 * @returns {Object} объект отрезка времени
 */
function getTimeObject(from, to) {
    var newTimeObject = {};
    newTimeObject.from = from;
    newTimeObject.to = to;
    return newTimeObject;
}

/** Возвращае массив с отрезками времени работы банка в минутах на каждый день
 * @param {Object} workingHours часы работы банка
 * @returns {Array} массив с отрезками времени работы банка в минутах на каждый день
 */
function bankTimeInMinutes(workingHours) {
    var bankTimes = [];
    for (var i = 1; i < 6; i++) {
        var from = moment.takeTimeInMinutesUTC(DAYS_OF_WEEK[i] + ' ' + workingHours.from, false);
        var to = moment.takeTimeInMinutesUTC(DAYS_OF_WEEK[i] + ' ' + workingHours.to, false);
        var newTimeObject = getTimeObject(from, to);
        if (newTimeObject.from > newTimeObject.to) {
            newTimeObject.to += 24 * 60;
        }
        bankTimes.push(newTimeObject);
    };
    return bankTimes;
}

/** Конвертирует объект с временами в стороках в объект занятости в минитах
 * @param {Object} data объект с временами в стороках для одного или нескольких сущностей
 * @returns {Object} объект с временами в минутах
 */
function convertTimeObjectToMinutesUTC(data) {
    for (var person in data) {
        for (var period in data[person]) {
            var from = moment.takeTimeInMinutesUTC(data[person][period].from, false);
            var to = moment.takeTimeInMinutesUTC(data[person][period].to, false);
            data[person][period] = getTimeObject(from, to);
        }
    }
    return data;
}

/** Конвертирует минуты в строку с временем UTC
 * @param {number} minutes количество минут
 * @returns {string} строка со временим UTC
 */
function takeStringTimeFromMinutes(minutes) {
    var date = moment.takeUTCTimeFromMinutes(minutes);
    return moment.toStringUTC(date, false);
}

/** По объектам с отрезками времени находит новые отрезки в их промежутках
 * @param {Object} dateInfo объект с отрезками времени для одной или нескольких сущностей
 * @returns {Object} объект с отрезками времени для одной или нескольких сущностей
 */
function reversTime(dateInfo) {
    for (var person in dateInfo) {
        dateInfo[person] = reversTimeArray(dateInfo[person]);
    };
    return dateInfo;
}

/** По отрезками времени находит новые отрезки в их промежутках
 * @param {Array} personTime массив с отрезками времени
 * @returns {Array} массив с отрезками времени
 */
function reversTimeArray(personTime) {
    var maxTime = moment.takeTimeInMinutesUTC('ЧТ 00:00' + bankTimezone, false);
    var minTime = moment.takeTimeInMinutesUTC('ПН 00:00' + bankTimezone, false);
    if (personTime.length === 0) {
        return [getTimeObject(minTime, maxTime)];
    }
    var timeObjectArray = [];
    var i = 0;
    var first = getTimeObject(minTime, personTime[i].from);
    timeObjectArray.push(first);
    for (i = 0; i < personTime.length - 1; i++) {
        var time = getTimeObject(personTime[i].to, personTime[i + 1].from);
        timeObjectArray.push(time);
    }
    var last = getTimeObject(personTime[i].to, maxTime);
    timeObjectArray.push(last);
    return timeObjectArray;
}

/** По объектам с массивами отрезков времени находит их пересечение длины не меньшей minDuration
 * @param {Object} dateInfo объект с массивами отрезков времени для одной или нескольких
сущностей
 * @param {number} minDuration минимальный размер пересечения
 * @returns {Object} отрезок времени, существующий для каждой сущности
и длины не меньшей minDuration
 */
function findIntersection(dateInfo, minDuration) {
    var periods = dateInfo.bank;
    for (var person in dateInfo) {
        periods = crossTimeArray(periods, dateInfo[person]);
    }
    var correctPeriods = [];
    for (var i = 0; i < periods.length; i++) {
        if ((periods[i].to - periods[i].from) >= minDuration) {
            correctPeriods.push(periods[i]);
        };
    };
    return correctPeriods[0];
}

/** Ищет пересечения отрезков между двум массивами с отрезками
 * @param {Array} first массив с отрезками времени
 * @param {Array} second массив с отрезками времени
 * @returns {Array} массив содержащий все пересечения first и second
 */
function crossTimeArray(first, second) {
    var resultArray = [];
    for (var i = 0; i < first.length; i++) {
        for (var j = 0; j < second.length; j++) {
            if (first[i].from <= second[j].to && first[i].to >= second[j].from) {
                var from = Math.max(first[i].from, second[j].from);
                var to = Math.min(first[i].to, second[j].to);
                resultArray.push(getTimeObject(from, to));
            }
        }
    };
    return resultArray;
}
