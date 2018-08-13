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
var imgc = []; //images
var scened = []; //scenes
var cam = {x:0,y:0,z:0,a:0,b:0,c:0};

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
    for (var idx = 25; idx < 33; idx++) {
        //var d = data[idx].split("").map(Number); good for 10x10x10 but not bigger
        var d = data[idx].split("").map(n => parseInt(n,36));
        var verts = [];
        var indcs = [];
        var norms = [];
        var colrs = [];

        var mats = [];
        var i,j,c = 0;
        var ver;
        for (i = 1; i < d[0]*3+1; i += 3) {
            mats.push([d[i],d[i+1],d[i+2]]);
        }
        var placeSingle = d.indexOf(35);
        if (placeSingle == -1)
            placeSingle = d.length; //reusing d.length, for some reason 99999 compresses bad
        for (i = d[0]*3+1; i < d.length; i += (i < placeSingle) ? 7 : 4) {
            var x1,y1,z1,x2,y2,z2,mat;
            if (i == placeSingle)
                i++;
            x1 = d[i];
            y1 = d[i+2];
            z1 = d[i+1];
            if (i >= placeSingle) {
                x2 = x1;
                y2 = y1;
                z2 = z1;
                mat = mats[d[i+3]];
            } else {
                x2 = d[i+3];
                y2 = d[i+5];
                z2 = d[i+4];
                mat = mats[d[i+6]];
            }
            ver = createCubeOfDims(
                0.0+x1/-10+0.8,
                0.0+y1/ 10-0.0,
                0.0+z1/ 10-0.0,
               -0.1+x2/-10+0.8,
                0.1+y2/ 10-0.0,
                0.1+z2/ 10-0.0
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
    for (var idx = 50; idx < 51; idx++) {
        var canvas = document.createElement("canvas");
        canvas.width = 2 ** (parseInt(data[idx][0]) + 3);
        canvas.height = 2 ** (parseInt(data[idx][1]) + 3);

		var ctx = canvas.getContext("2d");

        var d = data[idx].slice(5).match(/[\da-f][\da-f]/gi).map(n => parseInt(n) * 5); //remove hex match if we don't need it

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
    for (var idx = 0; idx < 1; idx++) {
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
    for (var i of d) {
        if (i.t == 0) { //image
            canvas2dctx.drawImage(imgc[i.i], i.x, i.y);
        } else if (i.t == 1) { //text
            canvas2dctx.fillStyle = "#fff";
            canvas2dctx.fillText(i.s, i.x, i.y);
        } else if (i.t == 2) { //button
            if (i.x <= xMouse && xMouse < i.x+i.w &&
                i.y <= yMouse && yMouse < i.y+i.h) {
                canvas2dctx.fillStyle = "#444";
                selectedUi = i;
            } else {
                canvas2dctx.fillStyle = "#777";
            }
            canvas2dctx.fillRect(i.x, i.y, i.w, i.h);
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

    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(0.4, 0.4, 0.4);
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
//#region input (PLEASE REWORK [xem's keyboard input, super mouse, etc])
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

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
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

var keysDown = {};
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
}

function move(len, deg) {
    cam.x += len * Math.cos(((-cam.b*180/Math.PI+deg)%360)*Math.PI/180);
    cam.z += len * Math.sin(((-cam.b*180/Math.PI+deg)%360)*Math.PI/180);
}
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

    handleKeys();

    scene.forEach(function(obj) {
        renderObj(obj);
    });

    stats.end();

    requestAnimationFrame(render);
}
//#endregion
//#region render and scene
function renderObj(obj) {
    var proj = new Float32Array(persp(gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100));
    var vm = new Float32Array(lookAtFps([cam.x-obj.tfm.x,cam.y-obj.tfm.y,cam.z-obj.tfm.z],cam.a,cam.b));
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
        col: colorBuffer
    });
}
function removeSceneObj(obj) {
    var idx = scene.indexOf(obj);
    if (idx !== -1) {
        scene.splice(idx, 1);
    }
}
function loadScene(sceneIdx) {
    for (var s in scened[sceneIdx]) {
        s = scened[sceneIdx][s];
        //console.log ("adding obj at " + s.x + " " + s.y + " " + s.z + " - " + s.m);
        addSceneObj(tfm((s.x-500)/-10, (s.z-500)/10, (s.y-500)/10), s.m);
    }
}
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
function lookAtFps(eye, pitch, yaw) {
    var cosPitch = Math.cos(((pitch+90)%180)-90);
    var sinPitch = Math.sin(((pitch+90)%180)-90);
    var cosYaw = Math.cos(yaw%360);
    var sinYaw = Math.sin(yaw%360);

    var xaxis = [cosYaw, 0, -sinYaw];
    var yaxis = [sinYaw * sinPitch, cosPitch, cosYaw * sinPitch];
    var zaxis = [sinYaw * cosPitch, -sinPitch, cosPitch * cosYaw];

    return [
        xaxis[0],yaxis[0],zaxis[0],0,
        xaxis[1],yaxis[1],zaxis[1],0,
        xaxis[2],yaxis[2],zaxis[2],0,
        -dot3(xaxis,eye),-dot3(yaxis,eye),-dot3(zaxis,eye),1
    ];
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
function tfm(posX, posY, posZ, rotX = 0, rotY = 0, rotZ = 0) {
    return {
        x: posX,
        y: posY,
        z: posZ,
        a: rotX,
        b: rotY,
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
    drawUi(51);
}
function menuClk() {
    if (selectedUi !== undefined) {
        switch (selectedUi.y) {
            case 220: ship(); break;
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
//  #region game

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
    x: 0,
    y: 0,
    z: 0
};
var ship_fadeIn = 0;
function ship() {
    curLoop = shipUpd;
    curClick = Function();
    lockMouse = true;

    loadScene(0);

    setDialogueFontSize();

    addSceneObj(tfm(0, 3, 0), 7);
    //shipFadeAsc();
}
function shipUpd() {
    drawUi(-1);
    //canvas2dctx.globalAlpha = ship_fadeIn;
    //canvas2dctx.fillStyle = "#000";
    //canvas2dctx.fillRect(0, 0, canvas2d.width, canvas2d.height);
}
async function shipFadeAsc() {
    ship_fadeIn = 1;
    await sleep(2000);
    for (i in new Array(100)) {
        ship_fadeIn -= 0.01;
        await sleep(50);
    }
}
//  #endregion
//#endregion

setup();