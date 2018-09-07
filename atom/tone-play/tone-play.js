//format:

//Header: MM POOWWW !!!!!
//M-milli per tick
//P-Pattern count
//O-Pattern order count
//W-Wave equation count
//!-Nothing, but you already know why it's there
//TODO could microop by putting sizes at beginning of their
//blocks to prevent using a variable there

//Pattern block:
//Desc - holds patterns of notes, can be used multiple times
//LLLWSSN...(
//L-Notes count
//W-Wave number
//S-Starting note
//N-Notes
//  0-4 = Go down 1-5 notes
//  5-9 = Go up 1-5 notes
//  nH = Sustain note H length
//  xRR = Rest of R length

//Pattern order block:
//Desc - a list of pattern indexes
//P...
//P-Patterns
//  0-9 = Selects pattern 0-9
//  (0-9 = Selects pattern 10-19
//  )0-9 = Selects pattern 20-29
//  (note this applies to all numbers, but used mostly here)
//TODO improve on this, last time we alternated symbols and
//numbers it compressed real bad (use letters and high radix?)

//Wave equations block:
//Desc - holds wave equations (like sin(x)) for samples
//LLSSST...
//L-Length of equation
//S-Data sample count
//T-Text of equation where x is time

var dat;
var mvr; //pointer location
var songs = [];
var songInstance;
function read(data) {
    dat = data;
    mvr = 0;
    var ps = [];
    var os = [];
    var ws = [];
    var m = readNum(2);
    var p = readNum(1);
    var o = readNum(2);
    var w = readNum(3);
    for (var i = 0; i < p; i++) {
        var timeline = [];
        var notes = readNum(3);
        var wave = readNum(1);
        var note = readNum(2);
        for (var j = 0; j < notes; j++) {
            var c = readChar();
            if (c == "n") {
                timeline.concat(Array(readNum(1)).fill(note));
            } else if (c == "x") {
                timeline.concat(Array(readNum(2)).fill(0));
            } else {
                var n = readNum(1);

// 00 01 02 03 04 05 06 07 08 09   10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29
//<05<04<03<02<01 01>02>03>04>05> <15<14<13<12<11<10<09<08<07<06 06>07>08>09>10>11>12>13>14>15>
                note += ((n<9)?((n<5)?(n-5):(n-4)):((n<20)?(n-25):(n-14))); //TODO mop

                timeline.concat(note);
            }
        }
        ps.push([w,timeline]);
    }
    for (var i = 0; i < o; i++) {
        os.push(readNum(1));
    }
    for (var i = 0; i < w; i++) {
        var len = readNum(2);
        var samps = readNum(3);
        ws.push(createSample(new Function("x", "return " + dat.substr(mvr, len)), samps));
        mvr += len;
    }
    songs.push([t,ps,os,ws]);
}

function play(index) {
    var song = songs[index];
    var tick = 0;
    songInstance = setInterval(function() {

	}, song[0]);
}

function readNum(len) {
    var tex = dat.substr(mvr, len);
    mvr += len;
    if (tex.startsWith("(")) {
        return parseInt(tex.substr(1)) + (Math.pow(10,len-1)); //we may never need this,
    }                                                          //in that case, just use 10 & 20
    if (tex.startsWith(")")) {
        return parseInt(tex.substr(1)) + (Math.pow(10,len-1))*2;
    }
    return parseInt(tex);
}

function readChar() {
    mvr += 1;
    return dat[mvr-1];
}

//saves 52 compressed/125 uncompressed bytes from lossst player
//https://xem.github.io/articles/#js13k17 (search mkaudio)
function createSample(waveEquation, len) {
    //reusing vars for mop
    var tex = "";
    for (var i = 0; i < len; i++) {
        var v = waveEquation(i);
        tex += wordByte((v<0)?v+65535:v).slice(0,-1);
    }
    //looks like someone had the same idea
    //https://github.com/Siorki/js13kgames/blob/master/2013%20-%20staccato/chiptune.js#L132
    //may not need the = after atob
    dat = "RIFF"+wordByte(len*2+36)+"\0WAVEfmt "+atob("EAAAAAEAAQBErAAAiFgBAAIAEAA=")+"data"+wordByte(len)+"\0"+tex;
    return new Audio("data:audio/wav;base64,"+btoa(dat));
}

createSample(function(x){return (((Math.sin(x*Math.PI/180)**5)+Math.sin(x*Math.PI/180)**3)+(Math.sin(x*Math.PI/180)**6))}, 1000);

var z = String.fromCharCode; //MOP
function wordByte(num) {
    return z(num&255)+z(num&0xFF00>>8)+z(num>>16);
    //for two numbers, much smaller but very limited
    //return z(num&255)+z(num>>8);
}

//deprecated for createSample
function createGraph(equation, start, end, precision) {
    var graph = [];
    for (var x = start; x < end; x += precision) {
        graph.push(equation(x));
    }
    return graph;
}

//read("");
