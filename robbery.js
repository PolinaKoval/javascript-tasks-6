'use strict';
var daysOfWeek = ['ВС','ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
var moment = require('./moment');

// Выбирает подходящий ближайший момент начала ограбления
module.exports.getAppropriateMoment = function (json, minDuration, workingHours) {
    var appropriateMoment = moment();
    var data = JSON.parse(json);
    var dataInMinutes = convertTimeObjectToMinutesUTC(data);
    var freeTime = reversTime(dataInMinutes);
    freeTime.bank = bankTimeInMinutes(workingHours);
    var intersection = findIntersection(freeTime, minDuration);
    if (!intersection) {
        return appropriateMoment;
    }
    var bankTimezone = parseInt(workingHours.from.slice(-2));
    var robberyTime = takeStringTimeFromMinutes(intersection.from);
    appropriateMoment.date = robberyTime;
    appropriateMoment.timezone = bankTimezone;
    return appropriateMoment;
};

// Возвращает статус ограбления (этот метод уже готов!)
module.exports.getStatus = function (moment, robberyMoment) {
    if (moment.date < robberyMoment.date) {
        // «До ограбления остался 1 день 6 часов 59 минут»
        return robberyMoment.fromMoment(moment);
    }
    return 'Ограбление уже идёт!';
};

function getTimeObject(from, to) {
    var newTimeObject = {};
    newTimeObject.from = from;
    newTimeObject.to = to;
    return newTimeObject;
}

function bankTimeInMinutes(workingHours) {
    var bankTimes = [];
    for (var i = 0; i < 4; i++) {
        var from = moment.takeTimeInMinutesUTC(daysOfWeek[i] + ' ' + workingHours.from, false);
        var to = moment.takeTimeInMinutesUTC(daysOfWeek[i] + ' ' + workingHours.to, false);
        var newTimeObject = getTimeObject(from, to);
        if (newTimeObject.from > newTimeObject.to) {
            newTimeObject.to += 24 * 60;
        }
        bankTimes.push(newTimeObject);
    };
    return bankTimes;
}

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

function takeStringTimeFromMinutes(minutes) {
    var date = moment.takeUTCTimeFromMinutes(minutes);
    return moment.toStringUTC(date, false);
}

function reversTime(dateInfo) {
    for (var person in dateInfo) {
        dateInfo[person] = reversTimeArray(dateInfo[person]);
    };
    return dateInfo;
}

function reversTimeArray(personTime) {
    var maxTime = moment.takeTimeInMinutesUTC('ЧТ 00:00+0', false);
    var minTime = moment.takeTimeInMinutesUTC('ПН 00:00+0', false);
    if (personTime.length === 0) {
        return getTimeObject(minTime, maxTime);
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
