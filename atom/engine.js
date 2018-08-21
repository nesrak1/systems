//chiisai 5/5/2018 nes

//debug
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

//#region variables
var gl;
var shaderProgram;
var scene = [];
var modelv = []; //verts
var modeli = []; //indices
var modeln = []; //norms
var modelc = []; //colors
var modelm = []; //centers [middles]
var imgc = []; //images
var scened = []; //scenes
var cam = {x:0,y:0,z:0,a:0,b:0,c:0};
var curScene = 0;

var canvas2d;
var canvas2dctx;
var lockMouse = false;

var curLoop;
var curClick = Function();

var xMouse, yMouse;
var selectedUi;

var fontSize;
var textStart = 64;
//#endregion
//#region models + textures
function voxelize() {
    //use voxelbox to generate strings, then copy them into data.js
    for (var idx = 25; idx < 51; idx++) {
        //var d = data[idx].split("").map(Number); good for 10x10x10 but not bigger
        var d = data[idx].split("").map(n => parseInt(n,36));
        var verts = [];
        var indcs = [];
        var norms = [];
        var colrs = [];

        var mats = [];
        var i,j,c = 0;
        var ver;
        for (i = 4; i < d[3]*3+4; i += 3) {
            mats.push([d[i],d[i+1],d[i+2]]);
        }
        var placeSingle = d.indexOf(35);
        if (placeSingle == -1)
            placeSingle = d.length; //reusing d.length, for some reason 99999 compresses bad

        for (i = d[3]*3+4; i < d.length; i += (i < placeSingle) ? 7 : 4) {
            var x1,y1,z1,x2,y2,z2,mat;
            if (i == placeSingle)
                i++;
            var off = (idx>31&&idx<35||idx==41)?-0.5:0; //hack for rotating objects with odd width/height
            x1 = d[i]-~~(d[0]/2)+off;
            y1 = d[i+2]-~~(d[2]/2)+off;
            z1 = d[i+1]-~~(d[1]/2)+off;
            if (i >= placeSingle) {
                x2 = x1;
                y2 = y1;
                z2 = z1;
                mat = mats[d[i+3]];
            } else {
                x2 = d[i+3]-~~(d[0]/2)+off;
                y2 = d[i+5]-~~(d[2]/2)+off;
                z2 = d[i+4]-~~(d[1]/2)+off;
                mat = mats[d[i+6]];
            }
            var sz = idx==47?5:idx>47?2:10;
            ver = createCubeOfDims(
                0.0+x1/-sz,
                0.0+y1/ sz,
                0.0+z1/ sz,
               -0.1+x2/-sz,
                0.1+y2/ sz,
                0.1+z2/ sz
            );
            for (j = 0; j < 72; j++) {
                verts[j+(c*72)] = ver[j];
            }
            norms = norms.concat([
                0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0
            ]);
            var glass = (mat[0] == 0 && mat[1] == 8 && mat[2] == 8);
            var colConv = glass ? 0 : 0.125;
            var alpha = glass ? 0.5 : 1;
            for (j = 0; j < 24; j++) {
                colrs = colrs.concat([
                    mat[0]*colConv,mat[1]*colConv,mat[2]*colConv,alpha
                ]);
            }
            c++;
        }
        indcs = createIndiciesOfCount(verts.length/6);

        modelv.push(verts);
        modeli.push(indcs);
        modeln.push(norms);
        modelc.push(colrs);
        modelm.push([d[0]/2,d[1]/2,d[2]/2]);
    }
}

function createIndiciesOfCount(count) {
    var array = [];
    for (var i = 0; i < count*4; i+=4) {
        array = array.concat([i,i+1,i+2,i,i+2,i+3]);
    }
    return array;
}

function createCubeOfDims(x1,y1,z1,x2,y2,z2) {
    return [
        //top z+
        x1,y2,z2,
        x2,y2,z2,
        x2,y1,z2,
        x1,y1,z2,
        //bottom z-
        x1,y1,z1,
        x2,y1,z1,
        x2,y2,z1,
        x1,y2,z1,
        //front x+
        x2,y1,z2,
        x2,y2,z2,
        x2,y2,z1,
        x2,y1,z1,
        //back x-
        x1,y2,z2,
        x1,y1,z2,
        x1,y1,z1,
        x1,y2,z1,
        //right y+
        x2,y2,z2,
        x1,y2,z2,
        x1,y2,z1,
        x2,y2,z1,
        //left y-
        x1,y1,z2,
        x2,y1,z2,
        x2,y1,z1,
        x1,y1,z1
    ];
}

function drawsvg() {
    //use svgcompress to generate strings, also in data.js
    for (var idx = 60; idx < 66; idx++) {
        var canvas = document.createElement("canvas");
        canvas.width = 2 ** (parseInt(data[idx][0]) + 3);
        canvas.height = 2 ** (parseInt(data[idx][1]) + 3);

		var ctx = canvas.getContext("2d");

        var d = data[idx].slice(6).match(/[\da-f][\da-f]/gi).map(n => parseInt(n) * 5); //remove hex match if we don't need it

        var scale = 1/(2**data[idx][5]);
        ctx.scale(scale, scale);
        
		ctx.fillStyle = "#fff";
        for (var i = 0; i < d.length; i += 4) {
            ctx.fillRect(d[i]-2,d[i+1]-2,d[i+2]+4,d[i+3]+4);
        }

        ctx.fillStyle = "#" + data[idx].slice(2, 5);
        for (var i = 0; i < d.length; i += 4) {
            ctx.fillRect(d[i],d[i+1],d[i+2],d[i+3]);
        }
        imgc.push(canvas);
    }
}

function buildscene() {
    for (var idx = 0; idx < 2; idx++) {
        var l = parseInt(data[idx].slice(0, 2));
        var d = data[idx].substr(2, l*9).match(/[\d][\d][\d]/g).map(n => parseInt(n));
        var m = data[idx].slice(2 + l*9).match(/[\d][\d]/g).map(n => parseInt(n));
        var s = [];
        for (var i = 0; i < d.length; i += 3) {
            s.push({x:d[i],y:d[i+1],z:d[i+2],m:m[i/3]});
        }
        scened.push(s);
    }
}
//#endregion
//#region ui
function drawUi(group) {
    canvas2dctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
    if (group == -1) return;
    var d = data[group];
    canvas2dctx.font = "22px \"Lucida Sans Unicode\", \"Lucida Grande\", sans-serif"; //move into setup
    selectedUi = undefined;
    var offX = ~~Math.max(0, (canvas2d.width-640)/2);
    var offY = ~~Math.max(0, (canvas2d.height-480)/2);
    for (var i of d) {
        var rx = i.x+offX;
        var ry = i.y+offY;
        if (i.t == 0) { //image
            canvas2dctx.drawImage(imgc[i.i], rx, ry);
        } else if (i.t == 1) { //text
            canvas2dctx.fillStyle = "#fff";
            canvas2dctx.fillText(i.s.toUpperCase(), rx, ry);
        } else if (i.t > 1) { //pane/button
            if (rx <= xMouse && xMouse < rx+i.w &&
                ry <= yMouse && yMouse < ry+i.h && i.t == 3) {
                canvas2dctx.fillStyle = "#444";
                selectedUi = i;
            } else {
                canvas2dctx.fillStyle = "#777";
            }
            canvas2dctx.fillRect(rx, ry, i.w, i.h);
        }
    }
}
//#endregion
//#region shaders
//make sure to also change resource meta and the
//renderer code if you end up changing any names
var resources = {
    vert: `attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying lowp vec4 vColor;
varying highp vec3 vLighting;
void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    highp vec3 ambientLight = vec3(0.4, 0.4, 0.4);
    highp vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);
    highp vec3 directionalVector = normalize(vec3(0, 0, 1));
    highp vec4 transformedNormal = vec4(aVertexNormal, 1.0);
    highp float directional = max(dot(mat3(uModelViewMatrix) * transformedNormal.xyz, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColor * directional);
    vColor = aVertexColor;
}
`,
    frag: `varying lowp vec4 vColor;
varying highp vec3 vLighting;
void main(void) {
    gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
}
`
};

var resourceMeta = {
    aVertexPosition:{},
    aVertexNormal:{},
    aVertexColor:{},
    uModelViewMatrix:{},
    uProjectionMatrix:{}
};
//#endregion
//#region setup
function setup() {
    gl = document.getElementById("c").getContext("webgl2");
    canvas2d = document.getElementById("d");
    canvas2dctx = canvas2d.getContext("2d");

    var vertShaderSrc = resources.vert;
    var fragShaderSrc = resources.frag;

    var vertexShader = loadShader(gl.VERTEX_SHADER, vertShaderSrc);
    var fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragShaderSrc);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    //this won't work with closure so change this to array or separate variables
    Object.keys(resourceMeta).forEach(function (key) {
        if (key.startsWith("a"))
            resourceMeta[key] = gl.getAttribLocation(shaderProgram, key);
        else
            resourceMeta[key] = gl.getUniformLocation(shaderProgram, key);
    });

    setupLock();

    voxelize();
    drawsvg();
    buildscene();

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
	gl.enable(gl.CULL_FACE);

    curLoop = menu;
    requestAnimationFrame(render);

    //cam.b = Math.PI;
}
//#endregion
//#region input
function setupLock() {
    document.addEventListener("mousemove", setMousePos, false);

    canvas2d.requestPointerLock = canvas2d.requestPointerLock ||
                                  canvas2d.mozRequestPointerLock;

    document.exitPointerLock = document.exitPointerLock ||
                               document.mozExitPointerLock;

    canvas2d.onclick = function() {
        if (lockMouse)
            canvas2d.requestPointerLock();
        else
            curClick();
    };

    document.addEventListener("pointerlockchange", lockChangeAlert, false);
    document.addEventListener("mozpointerlockchange", lockChangeAlert, false);

    //document.onkeydown = handleKeyDown;
    //document.onkeyup = handleKeyUp;
}

function lockChangeAlert() {
    //var canvas = document.getElementById("d");
    if (document.pointerLockElement === canvas2d ||
        document.mozPointerLockElement === canvas2d) {
        document.addEventListener("mousemove", rotateCam, false);
        document.removeEventListener("mousemove", setMousePos, false);
    } else {
        document.removeEventListener("mousemove", rotateCam, false);
        document.addEventListener("mousemove", setMousePos, false);
    }
}

function rotateCam(e) {
    cam.b -= e.movementX/180;
    cam.a -= e.movementY/180;
}

function setMousePos(e) {
    var rect = canvas2d.getBoundingClientRect();
    xMouse = e.clientX - rect.left;
    yMouse = e.clientY - rect.top;
}

/*var keysDown = {};
function handleKeyDown(event) {
    keysDown[event.keyCode] = true;
}

function handleKeyUp(event) {
    keysDown[event.keyCode] = false;
}

function handleKeys() {
    if (keysDown[37] || keysDown[65]) {
        move(0.05,180);
    } else if (keysDown[39] || keysDown[68]) {
        move(0.05,0);
    }

    if (keysDown[38] || keysDown[87]) {
        move(0.05,-90);
    } else if (keysDown[40] || keysDown[83]) {
        move(0.05,90);
    }

    if (keysDown[32]) {
        cam.y += 0.05;
    } else if (keysDown[16] || keysDown[67]) {
        cam.y -= 0.05;
    }
}*/

function move(len, deg) {
    cam.x += len * Math.cos(((-cam.b*180/Math.PI+deg)%360)*Math.PI/180);
    cam.z += len * Math.sin(((-cam.b*180/Math.PI+deg)%360)*Math.PI/180);
}
var eUp = true;
var keys = [0,0,0,0,0];
document.onkeydown=document.onkeyup=e=>keys[[87,65,83,68,69].indexOf(e.which)]=e.type[5];
//var u=l=d=r=0;onkeydown=onkeyup=e=>top['lld,rlurdu'[e.which%32%17]]=e.type[5];
//#endregion
//#region loop
function render() {
    stats.begin();

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    curLoop();

    scene.forEach(function(obj) {
        renderObj(obj);
    });

    stats.end();

    requestAnimationFrame(render);
}
//#endregion
//#region render and scene
var proj, vm;
function renderObj(obj) {
    proj = new Float32Array(persp(gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 150));
    vm = new Float32Array(lookAtFps([cam.x-obj.tfm.x,cam.y-obj.tfm.y,cam.z-obj.tfm.z],cam.a,cam.b,obj.tfm.c));
    enableBuffer(resourceMeta.aVertexPosition, obj.pos, 3);
    enableBuffer(resourceMeta.aVertexNormal, obj.nrm, 3);
    enableBuffer(resourceMeta.aVertexColor, obj.col, 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.idx);
    gl.useProgram(shaderProgram);
    enableBuffer(resourceMeta.uProjectionMatrix, proj);
    enableBuffer(resourceMeta.uModelViewMatrix, vm);
    gl.drawElements(gl.TRIANGLES, obj.vct/2, gl.UNSIGNED_SHORT, 0);
}

function enableBuffer(attr, buff, compCount = undefined/*optional*/) {
    if (compCount !== undefined) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buff);
        gl.vertexAttribPointer(attr, compCount, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attr);
    } else {
        gl.uniformMatrix4fv(attr, false, buff);
    }
}

function addSceneObj(transform,modelIndex/*,shader*/) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelv[modelIndex]), gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modeli[modelIndex]), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modeln[modelIndex]), gl.STATIC_DRAW);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelc[modelIndex]), gl.STATIC_DRAW);

    scene.push({
        tfm: transform,
        pos: positionBuffer,
        vct: modelv[modelIndex].length,
        idx: indexBuffer,
        nrm: normalBuffer,
        col: colorBuffer,
        mdl: modelIndex
    });

    return scene[scene.length-1];
}
function removeSceneObj(obj) {
    var idx = scene.indexOf(obj);
    if (idx !== -1) {
        scene.splice(idx, 1);
    }
}
function loadScene(sceneIdx) {
    scene = [];
    if (sceneIdx == -1) return;
    for (var s in scened[sceneIdx]) {
        s = scened[sceneIdx][s];
        //console.log ("adding obj at " + s.x + " " + s.y + " " + s.z + " - " + s.m);
        addSceneObj(tfm((s.x-500)/-10, (s.z-500)/10, (s.y-500)/10), s.m);
    }
    curScene = sceneIdx;
}
//#endregion
//#region terrain

//#endregion
//#region utils
//shaders
function loadShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}
//matrices
function transform(posX, posY, posZ, rotX, rotY, rotZ) {
    var a = Math.cos(rotX);
    var b = Math.sin(rotX);
    var c = Math.cos(rotY);
    var d = Math.sin(rotY);
    var e = Math.cos(rotZ);
    var f = Math.sin(rotZ);
    return [c*e,c*f,-d,0,
           -a*f+b*d*e,a*e+b*d*f,b*c,0,
            a*d*e+b*f,a*d*f-b*e,a*c,0,
            posX,posY,posZ,1];
}
//https://www.3dgep.com/understanding-the-view-matrix/
//"The function to implement this camera model might look like this:"
function lookAtFps(eye, pitch, yaw, rot) {
    var cosPitch = Math.cos(((pitch+90)%180)-90);
    var sinPitch = Math.sin(((pitch+90)%180)-90);
    var cosYaw = Math.cos(yaw%360);
    var sinYaw = Math.sin(yaw%360);

    var xaxis = [cosYaw, 0, -sinYaw];
    var yaxis = [sinYaw * sinPitch, cosPitch, cosYaw * sinPitch];
    var zaxis = [sinYaw * cosPitch, -sinPitch, cosPitch * cosYaw];

    var a=xaxis[0];
    var b=yaxis[0];
    var c=zaxis[0];
    var g=xaxis[2];
    var h=yaxis[2];
    var i=zaxis[2];
    var m=Math.cos(rot);
    var o=Math.sin(rot);

    return [
        a*m+g*o,b*m+h*o,c*m+i*o,0,
        xaxis[1],yaxis[1],zaxis[1],0,
        a*-o+g*m,b*-o+h*m,c*-o+i*m,0,
        -dot3(xaxis,eye),-dot3(yaxis,eye),-dot3(zaxis,eye),1
    ];

    //return [
    //    xaxis[0],yaxis[0],zaxis[0],0,
    //    d*m+g*-o,h*-o+m*e,f*m+i*-o,0,
    //    d*o+g*m,h*m+o*e,f*o+i*m,0,
    //    -dot3(xaxis,eye),-dot3(yaxis,eye),-dot3(zaxis,eye),1
    //];

    //return [
    //    xaxis[0],yaxis[0],zaxis[0],0,
    //    xaxis[1],yaxis[1],zaxis[1],0,
    //    xaxis[2],yaxis[2],zaxis[2],0,
    //    -dot3(xaxis,eye),-dot3(yaxis,eye),-dot3(zaxis,eye),1
    //];
}
function dot3(u, v) {
    return u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
}
function cross(u, v) {
    return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
}
function norm(u) {
    var l = Math.sqrt((u[0]*u[0])+(u[1]*u[1])+(u[2]*u[2]));
    if (l > 0)
        return [u[0]/l,u[1]/l,u[2]/l];
    else
        return [0,0,0];
}

//https://webgl2fundamentals.org/webgl/lessons/webgl-3d-perspective.html
//"Here's a function to build the matrix."
function persp(aspect, near, far) {
    var fov = 0.7854;
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    var rangeInv = 1.0 / (near - far);
    return [
        f/aspect,0,0,0,
        0,f,0,0,
        0,0,(near+far)*rangeInv,-1,
        0,0,near*far*rangeInv*2,0
    ];
}
//bridges
function tfm(posX, posY, posZ, rotZ = 0) {
    return {
        x: posX,
        y: posY,
        z: posZ,
        c: rotZ
    }
}

function setDialogueFontSize() {
    fontSize = 999;
    do {
        fontSize--;
        canvas2dctx.font = fontSize + "px monospace";
    } while (canvas2dctx.measureText("f".repeat(42)).width > canvas2d.width - textStart);
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

var seed;
function seededRand() { //0-1
    return seed = (Math.sin(1/(seed/111222))/2);
}

function randRange(min, max) {
    return (seededRand()+0.5) * (max - min) + min;
}

//for (var i = 0; i < x; i++) => for(var i of loop(x))
function loop(i) {
    return [...Array(i).keys()];
}
//#endregion

//#region gamecode

//each region below is a different "scene" each
//scene has a start (which is the scene name by
//itself), the update code for calling render
//code (drawUi), and sometimes an async function
//for scripting (for the sleep function)

//  #region menu
var isFullScreen = false;
function menu() {
    curLoop = menuUpd;
    curClick = menuClk;
}
function menuUpd() {
    drawUi(70);
}
function menuClk() {
    if (selectedUi !== undefined) {
        switch (selectedUi.y) {
            case 220: ship(0); break;
            case 270:
                if ("g" in localStorage)
                    resume();
                break;
            case 320:
                isFullScreen = !isFullScreen;
                if (isFullScreen)
                    setCanvasSize(document.body.clientWidth, document.body.clientHeight);
                else
                    setCanvasSize(640, 480);
                break;
        }
    }
}
function setCanvasSize(width, height) {
    gl.canvas.width = width;
    gl.canvas.height = height;
    canvas2d.width = width;
    canvas2d.height = height;
    textStart = canvas2d.width*.1;
}
//  #endregion
//  #region intro (deleted)
/*var intro_dialogue = "";
function intro() {
    curLoop = introUpd;
    curClick = Function();
    setDialogueFontSize();
    introAsc();
}
function introUpd() {
    drawUi(-1); //clear screen

    var lines = intro_dialogue.split("\n");
    for (var i = 0; i < lines.length; i++)
        canvas2dctx.fillText(lines[i], textStart, 30 + (i * (fontSize + 1)));
}
async function introAsc() {
    await sleep(2000);
    for (var i = 0; i < 3; i++) {
        await sleep(100);
        if (i == 0) {
            cam.a = -0.55;
            cam.b = 0.785; //180 = pi so 180/45=4 so pi/4=0.785
            addSceneObj(tfm(-4,-7,-9),0);
        }
        if (i == 1) {
            scene = [];
            cam.a = 0.22;
            lockMouse = true;
            addSceneObj(tfm(-5,0,-5),1);
        }
        for (var j = 0; j < dialogue[i].length; j++) {
            intro_dialogue += dialogue[i][j];
            await sleep(70);
        }
        await sleep(4000);
        intro_dialogue = "";
    }
}*/
//  #endregion
//  #region ship
var ship_data = {
    notfirsttime: false,
    shiprepaired: false,
    fadein: 1,
    uiOpen: false,
    mapX: 0,
    mapY: 0,
    inShip: true,
    docked: false,
};
var player_data = {
    curmdl: undefined,
    runanim: 0,
    lastanim: 0,
    x: 0,
    y: 0,
    c: 0,
    offx: 0,
    offy: 0,
    lastx: 0,
    lasty: 0
};
function ship(shipScene) {
    curLoop = shipUpd;
    curClick = shipClk;
    //lockMouse = true;

    ship_data.inShip = true;

    loadScene(shipScene);

    setDialogueFontSize();

    cam.x = player_data.x;
    cam.z = player_data.y-2.6;
    player_data.curmdl = addSceneObj(tfm(player_data.x, 2.6, player_data.y), 7);

    if (ship_data.docked) {
        addSceneObj(tfm(-4.5,3.2,0), 3);
    } else {
        addSceneObj(tfm(-6,1.6,0), 1);
        addSceneObj(tfm(-6,3.2,1.5), 6);
        addSceneObj(tfm(-6,3.2,-1.6), 6);
    }

    shipAnimAsc();
}
function shipUpd() {
    if (!ship_data.uiOpen) {
        if (keys[1]) {
            player_data.x += 0.03;
            player_data.c = 0;
        } else if (keys[3]) {
            player_data.x -= 0.03;
            player_data.c = Math.PI;
        }
        if (keys[0]) {
            player_data.y += 0.03;
            player_data.c = Math.PI/2;
        } else if (keys[2]) {
            player_data.y -= 0.03;
            player_data.c = -Math.PI/2;
        }
    } else {
        var ship = data[71][data[71].length-1]; //todo: replace with literal
        ship.x = 187-space_data.x/1.5;
        ship.y = 255-space_data.y/1.5;
        drawUi(71);
    }

    for (var n = 0; n < scene.length; n++) { //for of was making lag spikes?
        var i = scene[n];
        if (i.mdl > 6 && i.mdl < 10)
            continue;
        var mdlMiddle = modelm[i.mdl];
        var midX = mdlMiddle[0]/10;
        var midY = mdlMiddle[1]/10;
        var pmid = 0.2;
        if ((i.tfm.x-midX) < (player_data.x+pmid) && (player_data.x-pmid) < (i.tfm.x+midX) &&
            (i.tfm.z-midY) < (player_data.y+pmid) && (player_data.y-pmid) < (i.tfm.z+midY) &&
            (i.tfm.y) > 1.6) {
            
            var collisX, collisY;

            if (i.tfm.x > player_data.x) {
                collisX = (i.tfm.x-midX) - (player_data.x+pmid);
            } else {
                collisX = (i.tfm.x+midX) - (player_data.x-pmid);
            }
            if (i.tfm.z > player_data.y) {
                collisY = (i.tfm.z-midY) - (player_data.y+pmid);
            } else {
                collisY = (i.tfm.z+midY) - (player_data.y-pmid);
            }

            if (Math.abs(collisX) < Math.abs(collisY)) {  
                player_data.x += collisX;
            } else {
                player_data.y += collisY;
            }
        }
    }

    if (player_data.x != player_data.lastx ||
        player_data.y != player_data.lasty ||
        player_data.lastanim != player_data.runanim) {
        //creates a new model everytime, ouch
        removeSceneObj(player_data.curmdl);
        player_data.curmdl = addSceneObj(tfm(player_data.x + player_data.offx, 2.6, player_data.y + player_data.offy, player_data.c), player_data.runanim);
        player_data.lastx = player_data.x;
        player_data.lasty = player_data.y;
        player_data.lastanim = player_data.runanim;
    }
    switch (curScene) {
        case 0:
            if (keys[4] && eUp) {
                eUp = false;
                if (-0.8 < player_data.x && player_data.x < 0.8 &&
                     2.5 < player_data.y && player_data.y < 4.2) {
                    ship_data.inShip = false;
                    space();
                }
                if (-4.2 < player_data.x && player_data.x <-2.8 &&
                       2 < player_data.y && player_data.y < 3.8) {
                    ship_data.uiOpen = true;
                }
            } else if (!keys[4] && !eUp) {
                eUp = true;
            }
            if (player_data.y < -4.2) {
                player_data.y = 2.8;
                cam.z = 2.8; //offset just a little bit to give a nudge effect when we change scenes
                loadScene(1);
            }
            break;
        case 1:
            if (player_data.y > 3.2) {
                player_data.y = -3.8;
                cam.z = -5.6;
                loadScene(0);
            }
            break;
    }

    cam.x += (player_data.x-cam.x) * 0.1;
    cam.y = 9;
    cam.z += ((player_data.y-2.6)-cam.z) * 0.1;
    cam.a = -1.1;
    cam.b = Math.PI;
    //cam.a = 0.6;
    if (ship_data.fadein > 0) {
        drawUi(-1);
        canvas2dctx.globalAlpha = ship_data.fadein;
        canvas2dctx.fillStyle = "#000";
        canvas2dctx.fillRect(0, 0, canvas2d.width, canvas2d.height);
        ship_data.fadein -= 0.004;
        if (ship_data.fadein <= 0) {
            canvas2dctx.globalAlpha = 1;
        }
    }
}
function shipClk() {
    if (selectedUi !== undefined && ship_data.uiOpen) {
        if (selectedUi.y == 420) {
            drawUi(-1);
            ship_data.uiOpen = false;
        }
    }
}
async function shipAnimAsc() {
    var frames = [7,8,7,9];
    var frame = 0;
    while (true) {
        await sleep(10);
        if (keys.slice(0,4).includes("w")) {
            player_data.runanim = frames[frame%4];
            frame++;
            await sleep(190);
        } else {
            player_data.runanim = 7;
        }
        if (!ship_data.inShip)
            return;
    }
    //ship_fadeIn = 1;
    //await sleep(2000);
    //for (i in new Array(100)) {
    //    ship_fadeIn -= 0.01;
    //    await sleep(50);
    //}
}
//  #endregion
//  #region space
var space_data = {
    x: 0,
    y: 0,
    xv: 0,
    yv: 0,
    c: 0,
    cv: 0,
    fv: 0,
    offx: 0,
    offy: 0,
    shipmdl: 0,
    starbuffer: {},
    starsloaded: {},
    starcheck: 0,
    xp:0,yp:0,xd:0,yd:0
};
function space() {
    scene = [];
    curLoop = spaceUpd;
    curClick = Function();
    //lockMouse = true;

    //loadScene(0);

    setDialogueFontSize();

    space_data.curmdl = addSceneObj(tfm(space_data.x, 3, space_data.y), 16);
    cam.x = space_data.x;
    cam.z = space_data.y-2.6;
    spaceLoadStarfield(0, 0);
    shipAnimAsc();
}
function starLoaded(x, y) {
    return space_data.starsloaded[x+","+y] != undefined;
}
function spaceUpd() {
    if (keys[1]) {
        space_data.cv = -0.03;
    } else if (keys[3]) {
        space_data.cv = 0.03;
    }
    if (keys[0]) {
        space_data.fv += 0.005;
    } else if (keys[2]) {
        space_data.fv -= 0.003;
    }
    if (keys[4] && eUp) {
        scene = [];
        space_data.starsloaded = [];
        eUp = false;
        ship(0);
    } else if (!keys[4] && !eUp) {
        eUp = true;
    }
    space_data.xv = Math.sin(-space_data.c)*space_data.fv;
    space_data.yv = Math.cos(-space_data.c)*space_data.fv;
    space_data.c += space_data.cv;
    space_data.cv /= 1.1;
    space_data.fv /= 1.05;
    space_data.x += space_data.xv;
    space_data.y += space_data.yv;
    space_data.curmdl.tfm = tfm(space_data.x, 3, space_data.y, space_data.c);

    space_data.starcheck--;
    if (space_data.starcheck < 1) {
        drawUi(-1);
        //canvas2dctx.fillStyle = "#fff";
        //canvas2dctx.fillText(space_data.x + "," + space_data.y, 10, 20);
        for (var i = 0; i < 4; i++) {
            //unvar
            space_data.xp = Math.floor((space_data.x+50)/100)+[0,1][i%2];
            space_data.yp = Math.floor((space_data.y+50)/100)+[0,0,1,1][i];
            //canvas2dctx.fillText(space_data.xp + "," + space_data.yp, 10, 40+(i*20));
            if (!starLoaded(space_data.xp,space_data.yp)) {
                //remember: up is y+ and left is x+!
                //x [ 0, 1, 0, 1]
                //y [ 0, 0, 1, 1]
                //vertical check
                //X [ 0, 0, 0, 0]
                //Y [ 2, 2,-2,-2]
                //horizontal check
                //X [ 2,-2, 2,-2]
                //Y [ 0, 0, 0, 0]
                var xChecks = [[0,0],[2,-2]];
                var yChecks = [[2,2,-2,-2],[0,0,0,0]];

                for (var j = 0; j < 2; j++) {
                    space_data.xd = space_data.xp+xChecks[j][i%2];
                    space_data.yd = space_data.yp+yChecks[j][i];
                    //var del = space_data.xd + "," + space_data.yd;
                    //console.log("trying to kill " + del);
                    if (starLoaded(space_data.xd, space_data.yd)) {
                        //console.log("killing " + del);
                        spaceKillStarfield(space_data.xd, space_data.yd);
                        delete space_data.starsloaded[space_data.xd+","+space_data.yd];
                    }
                }

                space_data.starsloaded[space_data.xp+","+space_data.yp] = " ";
                spaceLoadStarfield(space_data.xp, space_data.yp);
                //console.log("loading at " + (space_data.xp + "," + space_data.yp));
            }
        }
        space_data.starcheck = 30;
    }
    
    cam.x += (space_data.x-cam.x) * 0.1;
    cam.y = 9;
    cam.z += ((space_data.y-2.6)-cam.z) * 0.1;
    cam.a = -1.1;
    cam.b = Math.PI;
}
async function spaceLoadStarfield(x, y) {
    seed = 0.1+Math.abs(1000/((17*23+x)*23+y)); //hash function
    space_data.starbuffer[x+","+y] = [];
    for (var i = 0; i < 50; i++) {
        space_data.starbuffer[x+","+y].push(
            addSceneObj(
                tfm(
                    randRange(x*100-100,(x+1)*100-100),
                    (i%2==0)?-60:-90,
                    randRange(y*100-100,(y+1)*100-100)
                ),
            21)
        );
    }
    //supposed to be for starfield but eh whatever
    //space station
    if (x == -1 && y == 1) {
        space_data.starbuffer[x+","+y].push(
            addSceneObj(
                tfm(
                    -140,
                    2,
                    70
                ),
            22)
        );
    }
    //planets
    if (x == 0 && y == -1) {
        space_data.starbuffer[x+","+y].push(
            addSceneObj(
                tfm(
                    -20,
                    0,
                    -140
                ),
            23)
        );
    }
    if (x == 0 && y == 4) {
        space_data.starbuffer[x+","+y].push(
            addSceneObj(
                tfm(
                    -110,
                    0,
                    310
                ),
            25)
        );
    }
    if (x == -3 && y == -1) {
        space_data.starbuffer[x+","+y].push(
            addSceneObj(
                tfm(
                    -320,
                    0,
                    -110
                ),
            24)
        );
    }
}
async function spaceKillStarfield(x, y) {
    var sb = space_data.starbuffer[x+","+y];
    for (var i = 0; i < sb.length; i++) {
        removeSceneObj(sb[i]);
    }
    sb = [];
}
//  #endregion
//  #region planets
function planets() {
    curLoop = planetsUpd;
    curClick = planetsShoot;
    loadScene(-1);
}
function planetsUpd() {

}
function planetsShoot() {

}
//  #endregion
//#endregion

setup();