'use strict';

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
        console.log('Время не найдено');
        return appropriateMoment;
    }
    var robberyTime = takeUTCTimeFromMinutes(intersection.from);
    appropriateMoment.date = robberyTime;
    console.log('Найденное время UTC', robberyTime);
    var bankTimezone = parseInt(workingHours.from.slice(-2));
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


function parseDateToUTC(str) {
    var daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    var date = {};
    var dayOfWeek = daysOfWeek.indexOf(str.slice(0, 2));
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

function bankTimeInMinutes(workingHours) {
    var daysOfWeek = ['ПН', 'ВТ', 'СР'];
    var bankTimes = [];
    for (var i = 0; i < daysOfWeek.length; i++) {
        var newTimeObject = {};
        newTimeObject.from = takeTimeInMinutesUTC(daysOfWeek[i] + ' ' + workingHours.from);
        newTimeObject.to = takeTimeInMinutesUTC(daysOfWeek[i] + ' ' + workingHours.to);
        bankTimes.push(newTimeObject);
    };
    return bankTimes;
}

function convertTimeObjectToMinutesUTC(data) {
    for (var person in data) {
        for (var period in data[person]) {
            data[person][period].from = takeTimeInMinutesUTC(data[person][period].from);
            data[person][period].to = takeTimeInMinutesUTC(data[person][period].to);
        }
    }
    return data;
}

function takeTimeInMinutesUTC(str) {
    var date = parseDateToUTC(str);
    var hours = date.day * 24 + date.hours;
    var minutes = hours * 60 + date.minutes;
    return minutes;
}

function takeUTCTimeFromMinutes(minutes) {
    var str = '';
    var daysOfWeek = ['ПН', 'ВТ', 'СР'];
    var day = Math.floor(minutes / (24 * 60));
    minutes -= day * 24 * 60;
    var hours = Math.floor(minutes / 60);
    minutes -= 60 * hours;
    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    str += daysOfWeek[day] + ' ' + hours + ':' + minutes + '+0';
    return str;
}

function reversTime(dateInfo) {
    for (var person in dateInfo) {
        dateInfo[person] = reversTimeArray(dateInfo[person]);
    };
    return dateInfo;
}

function reversTimeArray(personTime) {
    var timeObjectArray = [];
    var i = 0;
    var first = {
        from: 0,
        to: personTime[i].from
    };
    timeObjectArray.push(first);
    for (i = 1; i < personTime.length - 1; i++) {
        var time = {
            from: personTime[i].to,
            to: personTime[i + 1].from
        };
        timeObjectArray.push(time);
    }
    var maxTime = takeTimeInMinutesUTC('ПТ 00:00+0');
    var last = {
        from: personTime[i].to,
        to: maxTime
    };
    timeObjectArray.push(last);
    return timeObjectArray;
}

function findIntersection(dateInfo, minDuration) {
    var periods = dateInfo.bank;
    for (var person in dateInfo) {
        periods = crossTimeArray(periods, dateInfo[person]);
    }
    for (var i = 0; i < periods.length; i++) {
        if ((periods[i].to - periods[i].from) < minDuration) {
            periods.splice(i, i + 1);
        };
    };
    return periods[0];
}

function crossTimeArray(first, second) {
    var resultArray = [];
    for (var i = 0; i < first.length; i++) {
        for (var j = 0; j < second.length; j++) {
            if (first[i].from <= second[j].to && first[i].to >= second[j].from) {
                var newPeriod = {};
                newPeriod.from = Math.max(first[i].from, second[j].from);
                newPeriod.to = Math.min(first[i].to, second[j].to);
                resultArray.push(newPeriod);
            }
        }
    };
    return resultArray;
}
