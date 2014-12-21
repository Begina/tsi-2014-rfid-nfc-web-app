var Utility = Utility || {};

Utility.areArraysEqualOrdered = function (array1, array2) {
    if(!Array.isArray(array1) || !Array.isArray(array2)) {
        throw 'Arguments to ' + arguments.callee.name + ' must be arrays.';
    }

    if (array1.length != array2.length) {
        return false;
    }

    for (var i=0; i<array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }

    return true;
};

module.exports = Utility;
