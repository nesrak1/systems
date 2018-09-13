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
var leveld = []; //bh levels
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
    for (var idx = 25; idx < 158; idx++) {
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
            var off = (idx>31&&idx<35||idx==41||(idx>50&&idx<54))||idx==43?-0.5:0; //hack for rotating objects with odd width/height
            var xoff = ((idx==45)?24:0);
            x1 = d[i]-~~(d[0]/2)+off-xoff;
            y1 = d[i+2]-~~(d[2]/2)+off;
            z1 = d[i+1]-~~(d[1]/2)+off;
            if (i >= placeSingle) {
                x2 = x1-xoff;
                y2 = y1;
                z2 = z1;
                mat = mats[d[i+3]];
            } else {
                x2 = d[i+3]-~~(d[0]/2)+off-xoff;
                y2 = d[i+5]-~~(d[2]/2)+off;
                z2 = d[i+4]-~~(d[1]/2)+off;
                mat = mats[d[i+6]];
            }
            var sz = idx==47?5:idx>47&&idx<51?2:(idx>63&&idx<71)||(idx>123&&idx<138)||idx==145?2.5:10;
            var sf = (10/sz-1)*0.1; //scale fix, fixes connections when models are large (like lava)
            ver = createCubeOfDims(
                0.0+x1/-sz,
                0.0+y1/ sz,
                0.0+z1/ sz,
               -0.1+x2/-sz-sf,
                0.1+y2/ sz+sf,
                0.1+z2/ sz+sf
            );
            for (j = 0; j < 72; j++) {
                verts[j+(c*72)] = ver[j];
            }
            norms = norms.concat([
                0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0
            ]);
            var glass = (mat[0] == 0 && mat[1] == 8 && mat[2] == 8);
            var trans = (mat[0] == 8 && mat[1] == 0 && mat[2] == 8);
            var colConv = glass || trans ? 0.02 : 0.125;
            var alpha = glass ? 0.5 : trans ? 0 : idx == 45 ? 0.8 : 1;
            for (j = 0; j < 24; j++) {
                colrs = colrs.concat([
                    mat[0]*colConv,mat[1]*colConv,mat[2]*colConv,alpha
                ]);
            }
            c++;
        }
        indcs = createIndiciesOfCount(verts.length/6);

        modelv.push(new Float32Array(verts));
        modeli.push(new Uint16Array(indcs));
        modeln.push(new Float32Array(norms));
        modelc.push(new Float32Array(colrs));
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
    for (var idx = 160; idx < 166; idx++) {
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

function loadsys() {
    for (var idx = 166; idx < 170; idx++) {
        leveld[idx-166] = [];
        var d = data[idx].split("").map(n => parseInt(n,36));
        var l = d.length/5;
        for (var i in loop(l)) {
            i = parseInt(i);
            leveld[idx-166].push([d[i], d[l+i], d[2*l+i], d[3*l+i], d[4*l+i]]);
        }
    }
}

function buildscene() {
    for (var idx = 0; idx < 9; idx++) {
        var l = parseInt(data[idx].slice(0, 2));
        var d = data[idx].substr(2, l*9).match(/[\d][\d][\d]/g).map(n => parseInt(n));
        var m = data[idx].slice(5 + l*9).match(/[0-9a-z]/g).map(n => parseInt(n, 36));
        var s = [];
        var j = 2 + l*9;
        
        for (var i = 0; i < d.length; i += 3) {
            s.push({x:d[i],y:d[i+1],z:d[i+2],m:m[i/3]+parseInt(data[idx].slice(j, j+3),10)});
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

    canvas2dctx.font = "22px \"Lucida Sans Unicode\", \"Lucida Grande\", sans-serif"; //move into setup

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
    loadsys();

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
	//gl.enable(gl.CULL_FACE);

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
var keys = [0,0,0,0,0,0,0];
document.onkeydown=document.onkeyup=e=>keys[[38,37,40,39,90,88,16].indexOf(e.which)]=e.type[5];
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
        if (obj.pss == 0)
            renderObj(obj);
    });

    gl.colorMask(false, false, false, false);

    scene.forEach(function(obj) {
        if (obj.pss == 1)
            renderObj(obj);
    });

    gl.colorMask(true, true, true, true);

    scene.forEach(function(obj) {
        if (obj.pss == 2)
            renderObj(obj);
    });

    stats.end();

    requestAnimationFrame(render);
}
//#endregion
//#region render and scene
var proj, vm;
function renderObj(obj) {
    proj = persp(gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 150);
    vm = lookAtFps(cam.x-obj.tfm.x,cam.y-obj.tfm.y,cam.z-obj.tfm.z,cam.a,cam.b,obj.tfm.c);
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

function addSceneObj(transform,modelIndex,pass = 0/*,shader*/) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelv[modelIndex], gl.STATIC_DRAW);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modeli[modelIndex], gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modeln[modelIndex], gl.STATIC_DRAW);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelc[modelIndex], gl.STATIC_DRAW);

    scene.push({
        tfm: transform,
        pos: positionBuffer,
        vct: modelv[modelIndex].length,
        idx: indexBuffer,
        nrm: normalBuffer,
        col: colorBuffer,
        mdl: modelIndex,
        pss: pass
    });

    return scene[scene.length-1];
}
function removeSceneObj(obj) {
    var idx = scene.indexOf(obj);
    gl.deleteBuffer(obj.pos);
    gl.deleteBuffer(obj.idx);
    gl.deleteBuffer(obj.nrm);
    gl.deleteBuffer(obj.col);
    if (idx !== -1) {
        scene.splice(idx, 1);
    }
}
function loadScene(sceneIdx, dontClearObjects = false) {
    if (!dontClearObjects)
        scene = [];
    invisWallScene = [];
    laserScene = [];
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
function lookAtFps(eyex, eyey, eyez, pitch, yaw, rot) {
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

    return Float32Array.of(
        a*m+g*o,b*m+h*o,c*m+i*o,0,
        xaxis[1],yaxis[1],zaxis[1],0,
        a*-o+g*m,b*-o+h*m,c*-o+i*m,0,
        -dot3(xaxis,eyex,eyey,eyez),-dot3(yaxis,eyex,eyey,eyez),-dot3(zaxis,eyex,eyey,eyez),1
    );
}
function dot3(u, v0,v1,v2) {
    return u[0]*v0+u[1]*v1+u[2]*v2;
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
function distanceFrom(x0,y0, x1,y1) {
    return Math.sqrt((x0-x1)**2+(y0-y1)**2);
}

//https://webgl2fundamentals.org/webgl/lessons/webgl-3d-perspective.html
//"Here's a function to build the matrix."
function persp(aspect, near, far) {
    var fov = 0.7854;
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    var rangeInv = 1.0 / (near - far);
    return Float32Array.of(
        f/aspect,0,0,0,
        0,f,0,0,
        0,0,(near+far)*rangeInv,-1,
        0,0,near*far*rangeInv*2,0
    );
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

function deleteArrayItem(array, value) {
    array.splice(array.indexOf(value), 1);
}
function deleteArrayItemIndex(array, index) {
    array.splice(index, 1);
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
    drawUi(170);
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
    shiprepaired: false,
    fadein: 1,
    tutUiOpen: false,
    firstTimeTut: true,
    mapX: 0,
    mapY: 0,
    inShip: true,
    docked: false
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
    lasty: 0,
    lockx: 0,
    locky: 0,
    locktimer: 0
};
var base_data = {
    firsttime: true,
    itemfirsttime: true,
    tutorialOpen: false,
    itemTakeOpen: false,
    notAllItemsOpen: false,
    curbaseid: 0,
    busted: 0,
    specialitem: undefined,
    collecteditems: [0,0,0],
    deactivatedcameras: [0,0],
    masks: [],
    cams: [],
    povs: [] //los but then it would be loss like the meme haha im so funny
};
function ship(shipScene) {
    curLoop = shipUpd;
    curClick = shipClk;
    //lockMouse = true;

    ship_data.inShip = true;

    loadShipScene(shipScene);

    if (ship_data.firstTimeTut) {
        ship_data.firstTimeTut = false;
        ship_data.tutUiOpen = true;
    }

    cam.x = player_data.x;
    cam.z = player_data.y-2.6;
    player_data.curmdl = addSceneObj(tfm(player_data.x, 2.6, player_data.y), 7);

    cam.y = 9;
    cam.a = -1.1;
    cam.b = Math.PI;

    shipAnimAsc();
}
function shipUpd() {
    if (!ship_data.uiOpen &&
        !base_data.tutorialOpen &&
        !base_data.itemTakeOpen &&
        !base_data.notAllItemsOpen &&
        !ship_data.tutUiOpen) {
        drawUi(-1);
        if (keys[1]) {
            player_data.x += 0.05;
            player_data.c = 0;
        } else if (keys[3]) {
            player_data.x -= 0.05;
            player_data.c = Math.PI;
        }
        if (keys[0]) {
            player_data.y += 0.05;
            player_data.c = Math.PI/2;
        } else if (keys[2]) {
            player_data.y -= 0.05;
            player_data.c = -Math.PI/2;
        }
    } else if (base_data.tutorialOpen) {
        drawUi(172);
    } else if (base_data.itemTakeOpen) {
        drawUi(173);
    } else if (base_data.notAllItemsOpen) {
        drawUi(176);
    } else if (ship_data.tutUiOpen) {
        drawUi(174);
    } else {
        var shipd = data[171][data[171].length-1];
        shipd.x = 187-space_data.x/1.5;
        shipd.y = 255-space_data.y/1.5;
        canvas2dctx.globalAlpha = 1;
        drawUi(171);
    }

    for (var n of loop(scene.length)) {
        var i = scene[n];
        if (i.mdl > 6 && i.mdl < 10 || i.mdl == 18 || i.mdl == 20 || i.mdl == 56)
            continue;
        var mdlMiddle = modelm[i.mdl];
        var midX = mdlMiddle[0]/10; //i.tfm.c==0?0:1 hack to work with rotation
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
                loadShipScene(1);
            }
            if (player_data.x < -7) {
                var a = distanceFrom(space_data.x, space_data.y, -20, -140);
                var b = distanceFrom(space_data.x, space_data.y, -110, 310);
                var c = distanceFrom(space_data.x, space_data.y, -320, -110);
                var d = distanceFrom(space_data.x, space_data.y, -140, 70);
                if (a < b && a < c && a < d) { //acid (known as snowstorm but changed back to acid)
                    loadBase(0);
                } else if (b < a && b < c && b < d) { //lava
                    loadBase(3);
                } else if (c < a && c < b && c < d) { //water
                    loadBase(5);
                } else if (d < a && d < b && d < c) { //station
                    player_data.x = 0;
                    player_data.y = -0.2;
                    loadScene(8);
                }
            }
            break;
        case 1:
            if (player_data.y > 3.2) {
                player_data.y = -3.8;
                cam.z = -5.6;
                loadShipScene(0);
            }
            break;
        case 2:
            if (keys[4] && eUp) {
                eUp = false;
                if (5 < player_data.x && player_data.x < 6.2 &&
                    -0.7 < player_data.y && player_data.y < 0.7 &&
                    !base_data.deactivatedcameras[0]) {
                    removeSceneObj(base_data.povs[1]);
                    deleteArrayItemIndex(base_data.povs, 1);
                    deleteArrayItemIndex(base_data.cams, 1);
                    player_data.lockx = -5;
                    player_data.locky = 5;
                    player_data.locktimer = 120;
                    base_data.deactivatedcameras[0] = true;
                }
                if (-5.1 < player_data.x && player_data.x < -3.8 &&
                    4 < player_data.y && player_data.y < 5.4 &&
                    base_data.deactivatedcameras[0] &&
                    !base_data.deactivatedcameras[1]) {
                    removeSceneObj(base_data.povs[5]);
                    removeSceneObj(base_data.povs[6]);
                    deleteArrayItemIndex(base_data.povs, 5);
                    deleteArrayItemIndex(base_data.cams, 5);
                    deleteArrayItemIndex(base_data.povs, 5);
                    deleteArrayItemIndex(base_data.cams, 5);
                    player_data.lockx = -5;
                    player_data.locky = -5;
                    player_data.locktimer = 120;
                    base_data.deactivatedcameras[1] = true;
                }
            } else if (!keys[4] && !eUp) {
                eUp = true;
            }
            if (player_data.x < -6 && player_data.y < -3.6) {
                player_data.x = 5.5;
                cam.x = 6;
                loadBase(1, false);
            }
            break;
        case 3:
            if (keys[4] && eUp) {
                eUp = false;
                if (-2.8 < player_data.x && player_data.x < -1.7 &&
                    -10.5 < player_data.y && player_data.y < -9.1 &&
                    !base_data.deactivatedcameras[0]) {
                    removeSceneObj(base_data.povs[0]);
                    removeSceneObj(base_data.povs[1]);
                    removeSceneObj(base_data.povs[2]);
                    removeSceneObj(base_data.povs[5]);
                    deleteArrayItemIndex(base_data.povs, 0);
                    deleteArrayItemIndex(base_data.cams, 0);
                    deleteArrayItemIndex(base_data.povs, 0);
                    deleteArrayItemIndex(base_data.cams, 0);
                    deleteArrayItemIndex(base_data.povs, 0);
                    deleteArrayItemIndex(base_data.cams, 0);
                    deleteArrayItemIndex(base_data.povs, 2);
                    deleteArrayItemIndex(base_data.cams, 2);
                    player_data.lockx = -5;
                    player_data.locky = -12.5;
                    player_data.locktimer = 120;
                    base_data.deactivatedcameras[0] = true;
                }
            } else if (!keys[4] && !eUp) {
                eUp = true;
            }
            if (player_data.x > 6 && player_data.y > -6) {
                player_data.x = -5.5;
                cam.x = -6;
                loadBase(0, false);
            }
            if (player_data.x < -6.44 && player_data.y < -13.7) {
                player_data.y = 6.5;
                cam.z = 7;
                player_data.x = -7.5;
                cam.x = -7.5;
                loadBase(2, false);
            }
            break;
        case 4:
            if (keys[4] && eUp) {
                eUp = false;
                if (-4.9 < player_data.x && player_data.x < -3.95 &&
                    2.3 < player_data.y && player_data.y < 3.05) {
                    removeSceneObj(base_data.specialitem);
                    base_data.collecteditems[0] = 1;
                    base_data.itemTakeOpen = true;
                }
            } else if (!keys[4] && !eUp) {
                eUp = true;
            }
            if (player_data.y > 7) {
                player_data.y = -13;
                cam.z = -12.7;
                player_data.x = -7.6;
                cam.x = -7.6;
                loadBase(1, false);
            }
            break;
        case 5:
            if (keys[4] && eUp) {
                eUp = false;
                if (2.3 < player_data.x && player_data.x < 3.5 &&
                    -4.4 < player_data.y && player_data.y < -3.1 &&
                    !base_data.deactivatedcameras[0]) {
                    removeSceneObj(base_data.povs[0]);
                    removeSceneObj(base_data.povs[1]);
                    removeSceneObj(base_data.povs[6]);
                    deleteArrayItemIndex(base_data.povs, 0);
                    deleteArrayItemIndex(base_data.cams, 0);
                    deleteArrayItemIndex(base_data.povs, 0);
                    deleteArrayItemIndex(base_data.cams, 0);
                    deleteArrayItemIndex(base_data.povs, 4);
                    deleteArrayItemIndex(base_data.cams, 4);
                    player_data.lockx = -3.5;
                    player_data.locky = 2;
                    player_data.locktimer = 120;
                    base_data.deactivatedcameras[0] = true;
                }
                if (4.4 < player_data.x && player_data.x < 5.8 &&
                    10.4 < player_data.y && player_data.y < 12 &&
                    base_data.deactivatedcameras[0] &&
                    !base_data.deactivatedcameras[1]) {
                    removeSceneObj(base_data.povs[5]);
                    removeSceneObj(base_data.povs[6]);
                    removeSceneObj(base_data.povs[7]);
                    deleteArrayItemIndex(base_data.povs, 5);
                    deleteArrayItemIndex(base_data.cams, 5);
                    deleteArrayItemIndex(base_data.povs, 5);
                    deleteArrayItemIndex(base_data.cams, 5);
                    deleteArrayItemIndex(base_data.povs, 5);
                    deleteArrayItemIndex(base_data.cams, 5);
                    player_data.lockx = -3.5;
                    player_data.locky = 10.5;
                    player_data.locktimer = 120;
                    base_data.deactivatedcameras[1] = true;
                }
            } else if (!keys[4] && !eUp) {
                eUp = true;
            }
            if (player_data.x < -5.15 && player_data.y > 11.83) {
                player_data.x -= 3.4; //hack for moving player back since this level wasn't designed to wrap
                cam.x -= 3.4;
                player_data.y = -5.4;
                cam.z = -5.6;
                loadBase(4, false);
            }
            /*if (player_data.x < -6.44 && player_data.y < -13.7) {
                player_data.y = 6.5;
                cam.z = 7;
                player_data.x = -7.5;
                cam.x = -7.5
                loadBase(2, false);
            }*/
            break;
        case 6:
            if (keys[4] && eUp) {
                eUp = false;
                if (10.82 < player_data.x && player_data.x < 11.75 &&
                    2.4 < player_data.y && player_data.y < 3.3) {
                    removeSceneObj(base_data.specialitem);
                    base_data.collecteditems[1] = 1;
                    base_data.itemTakeOpen = true;
                }
                
                if (-0.15 < player_data.x && player_data.x < 1.06 &&
                    -0.6 < player_data.y && player_data.y < 1 &&
                    !base_data.deactivatedcameras[0]) {
                    removeSceneObj(base_data.povs[5]);
                    deleteArrayItemIndex(base_data.povs, 5);
                    deleteArrayItemIndex(base_data.cams, 5);
                    player_data.lockx = 6.9;
                    player_data.locky = 2.85;
                    player_data.locktimer = 120;
                    base_data.deactivatedcameras[0] = true;
                }
            } else if (!keys[4] && !eUp) {
                eUp = true;
            }
            if (player_data.x < -8.65 && player_data.y < -5.4) {
                player_data.x += 3.4;
                cam.x += 3.4;
                player_data.y = 11.8;
                cam.z = 11.84;
                loadBase(3, false);
            }
            break;
        case 7:
            if (keys[4] && eUp) {
                eUp = false;
                if (-5.6 < player_data.x && player_data.x < -4.65 &&
                    12 < player_data.y && player_data.y < 12.9) {
                    removeSceneObj(base_data.specialitem);
                    base_data.collecteditems[2] = 1;
                    base_data.itemTakeOpen = true;
                }
            } else if (!keys[4] && !eUp) {
                eUp = true;
            }
            break;
        case 8:
            if (keys[4] && eUp) {
                eUp = false;
                if (-2.3 < player_data.x && player_data.x < -1.1 &&
                    -2.3 < player_data.y && player_data.y < -1.1) {
                    if (base_data.collecteditems[0] == 1 &&
                        base_data.collecteditems[1] == 1 &&
                        base_data.collecteditems[2] == 1) {
                        planets(3);
                    } else {
                        base_data.notAllItemsOpen = true;
                    }
                }
            } else if (!keys[4] && !eUp) {
                eUp = true;
            }
            if (player_data.x > 1.25 && player_data.y > -0.6) {
                ship(0);
            }
            break;
    }

    if (curScene > 1)
        updateCams();

    //mop
    var x = player_data.x;
    var y = player_data.y;
    if (player_data.locktimer > 0) {
        player_data.x = player_data.lockx;
        player_data.y = player_data.locky;
    }
    cam.x += (player_data.x-cam.x) * 0.1;
    //cam.y = 9;
    cam.z += ((player_data.y-2.6)-cam.z) * 0.1;
    if (player_data.locktimer > 0) {
        player_data.x = x;
        player_data.y = y;
        player_data.locktimer--;
    }
    //cam.a = 0.6;
    if (ship_data.fadein > 0) {
        canvas2dctx.globalAlpha = ship_data.fadein;
        canvas2dctx.fillStyle = "#000";
        canvas2dctx.fillRect(0, 0, canvas2d.width, canvas2d.height);
        ship_data.fadein -= 0.004;
        //if (ship_data.fadein <= 0) {
            canvas2dctx.globalAlpha = 1;
        //}
    } else {
        canvas2dctx.globalAlpha = 1;
        canvas2dctx.fillStyle = "#f00";
        canvas2dctx.fillRect(0, canvas2d.height-((base_data.busted/200)*canvas2d.height), 10, (base_data.busted/200)*canvas2d.height);
    }
}
function shipClk() {
    if (selectedUi !== undefined && (ship_data.uiOpen ||
                                     base_data.tutorialOpen ||
                                     base_data.itemTakeOpen ||
                                     base_data.notAllItemsOpen ||
                                     ship_data.tutUiOpen)) {
        if (selectedUi.y == 420) {          
            drawUi(-1);
            ship_data.uiOpen = false;
            base_data.tutorialOpen = false;
            base_data.notAllItemsOpen = false;
            ship_data.tutUiOpen = false;

            if (base_data.itemTakeOpen) {
                base_data.itemTakeOpen = false;
                switch (curScene) {
                    case 4:
                        planets(1);
                        break;
                    case 6:
                        planets(0);
                        break;
                    case 7:
                        planets(2);
                        break;
                }
            }
        }
    }
}
function loadShipScene(shipScene) {
    scene = [];

    spaceLoadStarfield(0, 0);
    spaceLoadStarfield(1, 0);
    spaceLoadStarfield(0, 1);
    spaceLoadStarfield(1, 1);

    loadScene(shipScene, true);

    if (shipScene == 0) {
        if (!ship_data.docked) {
            addSceneObj(tfm(-4.5,3.2,0), 3);
        } else {
            addSceneObj(tfm(-6,1.6,0), 1);
            addSceneObj(tfm(-6,3.2,1.5), 6);
            addSceneObj(tfm(-6,3.2,-1.6), 6);
        }
    }
}
var shipFrames = [7,8,7,9];
async function shipAnimAsc() {
    var frame = 0;
    while (true) {
        await sleep(10);
        if (keys.slice(0,4).includes("w")) {
            player_data.runanim = shipFrames[frame%4];
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
function loadBase(levelId, setLoc = true) {
    base_data.cams = [];
    base_data.povs = [];
    base_data.masks = [];
    base_data.deactivatedcameras = [0,0];
    if (setLoc) {
        player_data.x = [5,    5,  -7.5,  7.5,   -10.25, 9.6 ][levelId];
        player_data.y = [5.5, -5.5, 6.5, -10.25, -5,    -15.5][levelId];
    }

    if (base_data.firsttime) {
        base_data.firsttime = false;
        base_data.tutorialOpen = true;
    }

    levelId += 2;
    loadScene(levelId);
    for (var i of data[175+levelId]) {
        var r = i[2]*(Math.PI/2);
        var c = addSceneObj(tfm(i[0], 3.5, i[1], r), 18);
        base_data.povs.push(addSceneObj(tfm(i[0], 1.75, i[1], r), 20, 2));
        c.v = 0;
        c.r = r;
        c.m = 1;
        if (i[3] !== undefined)
            c.m = i[3];
        base_data.cams.push(c);
    }
    if (levelId == 0+2 || levelId == 1+2 || levelId == 2+2) {
        makeGround(0);
    }
    if (levelId == 1+2) {
        base_data.masks.push(addSceneObj(tfm(0.3, 1.7, -7.55, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(-5.7, 1.7, -7.55, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(-2.5, 1.7, -4.3, Math.PI/2), 56, 1));
        base_data.masks.push(addSceneObj(tfm(1.5, 1.7, -6, Math.PI/2), 56, 1));
        base_data.masks.push(addSceneObj(tfm(1.5, 1.7, -7, Math.PI/2), 56, 1));
        base_data.masks.push(addSceneObj(tfm(1.5, 1.7, -8, Math.PI/2), 56, 1));
        base_data.masks.push(addSceneObj(tfm(1.5, 1.7, -9, Math.PI/2), 56, 1));
    }
    if (levelId == 2+2) {
        base_data.specialitem = addSceneObj(tfm(-4.35,2.5,2.6), 113);
    }
    if (levelId == 3+2 || levelId == 4+2) {
        makeGround(1);
    }
    if (levelId == 3+2) {
        scene[64].tfm.c = Math.PI;
        scene[66].tfm.c = Math.PI/2;
    }
    if (levelId == 4+2) {
        base_data.masks.push(addSceneObj(tfm(-5.1, 1.7, -3, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(-5.1, 1.7, -2.6, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(-6.3, 1.7, -3, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(-6.3, 1.7, -2.6, 0), 56, 1));

        base_data.masks.push(addSceneObj(tfm(-2.3, 1.7, -3, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(-2.3, 1.7, -2.6, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(-1.1, 1.7, -3, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(-1.1, 1.7, -2.6, 0), 56, 1));

        base_data.masks.push(addSceneObj(tfm(1.7, 1.7, -3, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(1.7, 1.7, -2.6, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(2.9, 1.7, -3, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(2.9, 1.7, -2.6, 0), 56, 1));

        base_data.masks.push(addSceneObj(tfm(7.8, 1.7, 0.7, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(7.8, 1.7, 0.4, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(6.6, 1.7, 0.7, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(6.6, 1.7, 0.4, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(5.8, 1.7, 0.7, 0), 56, 1));
        base_data.masks.push(addSceneObj(tfm(5.8, 1.7, 0.4, 0), 56, 1));

        base_data.specialitem = addSceneObj(tfm(11.35,2.5,2.8), 114);
    }
    if (levelId == 5+2) {
        makeGround(2);
        base_data.specialitem = addSceneObj(tfm(-5.1,2.5,12.95), 115);
    }
}
function updateCams() {
    var k = 0;
    for (var i of base_data.cams) {
        i.v += 0.01;
        var multi = 1;
        i.tfm.c = i.r + Math.sin(i.v)/4*i.m;
        base_data.povs[k].tfm.c = i.tfm.c;
        k++;
        
        var x = player_data.x;
        var y = player_data.y;
        var tfm = base_data.povs[k-1].tfm;
        var x0 = tfm.x + 1 * Math.cos(tfm.c+(Math.PI/2));
        var y0 = tfm.z + 1 * Math.sin(tfm.c+(Math.PI/2));
        var xh = tfm.x + 1 * Math.cos(tfm.c-(Math.PI/2));
        var yh = tfm.z + 1 * Math.sin(tfm.c-(Math.PI/2));
        var xw = x0 + 4 * Math.cos(tfm.c);
        var yw = y0 + 4 * Math.sin(tfm.c);

        if (checkIfInArea(x, y, x0, y0, xw, yw, xh, yh) &&
            !inHidingArea(x, y)) {
            base_data.busted += 8;
        }
    }
    if (base_data.busted > 0)
        base_data.busted--;
    if (base_data.busted > 200) {
        base_data.busted = 0;
        loadBase(curScene-2);
    }
}
//https://math.stackexchange.com/questions/1805724/detect-if-point-is-within-rotated-rectangles-bounds
function checkIfInArea(x, y, x0, y0, xw, yw, xh, yh) {
    var xu = xw - x0;
    var yu = yw - y0;
    var xv = xh - x0;
    var yv = yh - y0;
    var L = xu * yv - xv * yu;
    if (L < 0) {
        L = -L;
        xu = -xu;
        yv = -yv;
    } else {
        xv = -xv;
        yu = -yu;
    }

    var u = (x - x0) * yv + (y - y0) * xv;
    if (u < 0 || u > L)
        return false;
    else {
        var v = (x - x0) * yu + (y - y0) * xu;
        if (v < 0 || v > L)
            return false;
        else
            return true;
    }
}
function inHidingArea(x, y) {
    for (var i of base_data.masks) {
        var midX = (i.c==0?6:4.5)/10;
        var midY = (i.c==0?4.5:6)/10;
        var pmid = 0.2;
        if ((i.tfm.x-midX) < (player_data.x+pmid) && (player_data.x-pmid) < (i.tfm.x+midX) &&
            (i.tfm.z-midY) < (player_data.y+pmid) && (player_data.y-pmid) < (i.tfm.z+midY))
            return true;
    }
    
    return false;
}
function makeGround(type) {
    for (var i in loop(8)) {
        for (var j in loop(8)) {
            var arrayItem = addSceneObj(tfm((i-4)*6.4, 0, (j-4)*6.4), [99,39,106][type]);
            scene.splice(scene.length-1, 1);
            scene.unshift(arrayItem); //hack for glass
        }
    }
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
    starbuffer: {},
    starsloaded: {},
    starcheck: 0,
    firstdock: true,
    tutorialOpen: false,
    xp:0,yp:0,xd:0,yd:0
};
function space() {
    scene = [];
    curLoop = spaceUpd;
    curClick = spaceClk;
    //lockMouse = true;

    //loadScene(0);

    space_data.curmdl = addSceneObj(tfm(space_data.x, 3, space_data.y), 19);
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
        space_data.fv += 0.0055;
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
    space_data.fv /= 1.02;
    space_data.x += space_data.xv;
    space_data.y += space_data.yv;
    space_data.curmdl.tfm = tfm(space_data.x, 3, space_data.y, space_data.c);

    var distanceToClosestPlanet = Math.min(
        distanceFrom(space_data.x, space_data.y, -20, -140),
        distanceFrom(space_data.x, space_data.y, -110, 310),
        distanceFrom(space_data.x, space_data.y, -320, -110)
    );
    if (distanceToClosestPlanet < 5) {
        space_data.fv *= (-1.1 - ((5-distanceToClosestPlanet)*0.3));
    }
    var distanceToSpaceStation = distanceFrom(space_data.x, space_data.y, -140, 70);
    if (distanceToSpaceStation < 1) {
        space_data.fv *= (-1.1 - ((3-distanceToSpaceStation)*0.3));
    }
    
    if (distanceToSpaceStation < 7 ||
        distanceToClosestPlanet < 12) {
        if (space_data.firstdock) {
            space_data.firstdock = false;
            space_data.tutorialOpen = true;
        }
        ship_data.docked = true;
    } else {
        ship_data.docked = false;
    }

    drawUi(-1);
    if (space_data.tutorialOpen) {
        drawUi(175);
    }

    space_data.starcheck--;
    if (space_data.starcheck < 1) {
        //canvas2dctx.fillStyle = "#fff";
        //canvas2dctx.fillText(space_data.x + "," + space_data.y, 10, 20);
        for (var i = 0; i < 4; i++) {
            //unvar
            space_data.xp = Math.floor((space_data.x+50)/100)+[0,1][i%2];
            space_data.yp = Math.floor((space_data.y+95)/100)+[0,0,1,1][i];
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
    
    cam.x += (space_data.x-cam.x) * 0.2;
    cam.y = 9;
    cam.z += ((space_data.y-2.6)-cam.z) * 0.2;
    cam.a = -1.1;
    cam.b = Math.PI;
}
function spaceClk() {
    if (selectedUi !== undefined && space_data.tutorialOpen) {
        if (selectedUi.y == 420) {
            drawUi(-1);
            space_data.tutorialOpen = false;
        }
    }
}
async function spaceLoadStarfield(x, y) {
    seed = 0.1+Math.abs(1000/((17*23+x)*23+y)); //hash function
    space_data.starbuffer[x+","+y] = [];
    for(var i of loop(50)) {
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
                tfm(-140, 2, 70),
            22)
        );
    }
    //planets
    if (x == 0 && y == -1) {
        space_data.starbuffer[x+","+y].push(
            addSceneObj(
                tfm(-20, 0, -140),
            23)
        );
    }
    if (x == 0 && y == 4) {
        space_data.starbuffer[x+","+y].push(
            addSceneObj(
                tfm(-110, 0, 310),
            25)
        );
    }
    if (x == -3 && y == -1) {
        space_data.starbuffer[x+","+y].push(
            addSceneObj(
                tfm(-320, 0, -110),
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
var planets_data = {
    nextSpawnTime: 160,
    ships: [],
    bullets: [],
    enemybullets: [],
    ground: [],
    x: 0,
    y: 10,
    curmdl: 0,
    shootTimer: 0,
    groundTimer: 0,
    bubbleTimer: 0,
    planet: -1,
    event: 0,
    score: 0,
    totalscore: 0,
};
function planets(planet) {
    scene = [];
    curLoop = planetsUpd;
    
    loadScene(-1);
    drawUi(-1);

    planets_data.curmdl = addSceneObj(tfm(0, 1, 10), 19);
    planets_data.planet = planet;
    planets_data.nextSpawnTime = 160;
    planets_data.ships = [];
    planets_data.bullets = [];
    planets_data.enemybullets = [];
    planets_data.shootTimer = 0;
    planets_data.groundTimer = 0;
    planets_data.bubbleTimer = 0;
    planets_data.event = 0;
    planets_data.score = 0;

    var ground = ([39,99,106,120][planet]);
    for (var i of loop(36)) {
        planets_data.ground.push(
            addSceneObj(tfm((~~(i/6)-2.5)*6.4, 0, ((i%6)+2)*6.4), ground)
        );
    }
    ship_data.fadein = 1;
    seed = 0.12495 + (planet*0.001);
    cam.x = 0;
    cam.y = 15;
    cam.z = 5;
    cam.a = -1.3;
}
//global variables because last day
var floorType = [39,99,106,120];
var enemyType = [27,26,28,27];
function planetsUpd() {
    var speed = (keys[6])?0.08:0.12;
    if (keys[1]) {
        planets_data.x += speed;
    } else if (keys[3]) {
        planets_data.x -= speed;
    }
    if (keys[0]) {
        planets_data.y += speed;
    } else if (keys[2]) {
        planets_data.y -= speed;
    }
    if (keys[4]) {
        if (planets_data.shootTimer < 1) {
            planets_data.shootTimer = 6;
            planets_data.bullets.push(
                addSceneObj(
                    tfm(planets_data.x, 1, planets_data.y+0.05),
                17)
            );
        }
    }

    planets_data.curmdl.tfm.x = planets_data.x;
    planets_data.curmdl.tfm.z = planets_data.y;

    planets_data.nextSpawnTime--;
    planets_data.shootTimer--;
    if (planets_data.planet != 3)
        planets_data.groundTimer--;
    planets_data.bubbleTimer--;
    if (planets_data.nextSpawnTime < 1) {
        function spawnEnemy(x, y, xd, yd, mode, count, mdl) {
            //planets_data.ships.push(
            //    addSceneObj(
            //        tfm(randRange(-6, 6), 1, cam.z+20),
            //    ~~randRange(26,28))
            //);
            count = (count==0)?(mode==1)?1:~~randRange(4,6):count;
            for (var i in loop(count)) {
                var xoff, yoff;
                if (mode != 2) {
                    xoff = randRange(-1.5,1.5);
                    yoff = randRange(-1.5,1.5);
                } else {
                    xoff = (xd<4)?(-i/1.5):i/1.5;
                    yoff = 0;
                }
                var obj = addSceneObj(tfm((x-4)*1.5, 1, y+6, mode==2?i*0.04:0), mdl);
                obj.xd = (xd-4)*1.5+xoff;
                obj.yd = yd+6+yoff;
                obj.xd2 = (x-4)*1.5+xoff;
                obj.yd2 = y+6+yoff;
                obj.afm = 0;
                planets_data.ships.push(obj);
            }
        }
        var leveldata = leveld[planets_data.planet][planets_data.event];
        switch (leveldata[0]) {
            case 0: //corner
                spawnEnemy(leveldata[1]<4?-1:9, 9, leveldata[1], leveldata[2], 0, leveldata[3], enemyType[planets_data.planet]);
                break;
            case 2: //train
                spawnEnemy(leveldata[1]==0?-1:9, leveldata[2], leveldata[1]==0?9:-1, leveldata[2], 2, leveldata[3], enemyType[planets_data.planet]);
                break;
            case 1: //single
                spawnEnemy(leveldata[1], 9, leveldata[1], leveldata[2], 1, 1, enemyType[planets_data.planet]);
                break;
            case 3: //boss
                var bossObj = addSceneObj(tfm(0, 3.2, 20), 116);
                bossObj.afm = 0;
                bossObj.hth = 100;
                planets_data.ships.push(bossObj);
                planets_data.ships.push(addSceneObj(tfm(0, 2.8, 20), 118));
                planets_data.ships.push(addSceneObj(tfm(0, 2.4, 20), 119));
                planets_data.ships.push(addSceneObj(tfm(0, 2, 20), 117));
                break;
        }
        planets_data.nextSpawnTime = planets_data.nextSpawnTime==9?99999999:leveldata[4]*60;
        planets_data.event++;
        if (planets_data.event > leveld[planets_data.planet].length-1) {
            planets_data.nextSpawnTime = 99999999;
            if (planets_data.planet != 3) {
                setTimeout(function() {
                    ship(0);
                    player_data.x = 0;
                    player_data.y = 0;
                    planets_data.totalscore += planets_data.score;
                }, 10000);
            }
        }
    }
    if (planets_data.groundTimer < 1 && planets_data.planet != 3) {
        planets_data.ground.push(
            addSceneObj(
                tfm(~~randRange(-9, 9), 0, ~~randRange(10, 26)),
            floorType[planets_data.planet]+1)
        );
        planets_data.groundTimer = randRange(15, 35);
    }
    for (var i of planets_data.ships) {
        i.afm += 0.01;

        if (i.mdl == 116) {
            if (i.afm%0.08<0.01) {
                planets_data.enemybullets.push(
                    addSceneObj(
                        tfm(i.tfm.x, 1, i.tfm.z, i.tfm.c+((i.afm%0.64)/0.16*Math.PI/2)),
                    17)
                );
                planets_data.enemybullets.push(
                    addSceneObj(
                        tfm(i.tfm.x, 1, i.tfm.z, i.tfm.c+Math.PI/2+((i.afm%0.64)/0.16*Math.PI/2)),
                    17)
                );
            }
            for (var j of planets_data.bullets) {
                if ((Math.sqrt(Math.abs(i.tfm.x-j.tfm.x)**2) + (Math.abs(i.tfm.z-j.tfm.z)**2)) < 1) {
                    removeSceneObj(j);
                    planets_data.bullets.splice(planets_data.bullets.indexOf(j), 1);
                    i.hth--;
                    planets_data.score += 10;
                }
                if (i.hth < 0) {
                    ship(0);
                    player_data.x = 0;
                    player_data.y = 0;
                    planets_data.totalscore += planets_data.score;
                }
            }
        }

        if (i.mdl > 115) {
            i.tfm.z += (12-i.tfm.z) * 0.05;
            continue;
        }
        //i.tfm.z -= 0.05;
        i.tfm.c += 0.03;
        //if (i.tfm.z < cam.z-5) {
        if (i.afm > Math.PI*2) {
            removeSceneObj(i);
            planets_data.ships.splice(planets_data.ships.indexOf(i), 1);
        }
        var percent = (Math.cos(i.afm)+1);
        i.tfm.x = i.xd+((i.xd2-i.xd)*percent);
        i.tfm.z = i.yd+((i.yd2-i.yd)*percent);

        if (i.afm%0.16<0.01) {
            planets_data.enemybullets.push(
                addSceneObj(
                    tfm(i.tfm.x, 1, i.tfm.z, i.tfm.c+((i.afm%0.64)/0.16*Math.PI/2)),
                17)
            );
        }

        for (var j of planets_data.bullets) {
            if ((Math.sqrt(Math.abs(i.tfm.x-j.tfm.x)**2) + (Math.abs(i.tfm.z-j.tfm.z)**2)) < 0.5) {
                removeSceneObj(i);
                removeSceneObj(j);
                planets_data.ships.splice(planets_data.ships.indexOf(i), 1);
                planets_data.bullets.splice(planets_data.bullets.indexOf(j), 1);
                planets_data.score += 200;
            }
        }
    }
    for (var i of planets_data.bullets) {
        i.tfm.z += 0.25;
        if (i.tfm.z > cam.z+20) {
            removeSceneObj(i);
        }
    }
    for (var i of planets_data.enemybullets) {
        i.tfm.x += Math.sin(-i.tfm.c)/10;
        i.tfm.z += Math.cos(-i.tfm.c)/10;
        if (i.t == undefined)
            i.t = -1;
        i.t += 1;
        //i.tfm.z -= 0.05;//Math.sin(i.tfm.c)*0.5;
        if (i.tfm.z > cam.z+20 || i.tfm.z < cam.z-5 || i.t > 240) {
            removeSceneObj(i);
            planets_data.enemybullets.splice(planets_data.enemybullets.indexOf(i), 1);
        }
        if ((Math.sqrt(Math.abs(i.tfm.x-planets_data.x)**2) + (Math.abs(i.tfm.z-planets_data.y)**2)) < 0.2) {
            removeSceneObj(i);
            planets_data.enemybullets.splice(planets_data.enemybullets.indexOf(i), 1);
            planets_data.score -= 50;
        }
    }

    drawUi(-1);
    canvas2dctx.fillStyle = "#fff";
    canvas2dctx.fillText("score: " + planets_data.score, 20, 20);

    for (var i of planets_data.ground) {
        i.tfm.z -= 0.2;
        var isGround = floorType.includes(i.mdl);
        if (i.tfm.z < cam.z-10) {
            if (isGround) {
                i.tfm.z += 32;
            } else {
                removeSceneObj(i);
                planets_data.ground.splice(planets_data.ground.indexOf(i), 1);
            }
        }
        if (!isGround && planets_data.bubbleTimer < 1) {
            if (floorType.includes(i.mdl-6)) {
                removeSceneObj(i);
                planets_data.ground.splice(planets_data.ground.indexOf(i), 1);
            } else {
                var trans = i.tfm;
                var mdl = i.mdl;
                removeSceneObj(i);
                planets_data.ground.splice(planets_data.ground.indexOf(i), 1);
                planets_data.ground.push(i = addSceneObj(trans, mdl+1));
            }
        }
    }
    if (planets_data.bubbleTimer < 1)
        planets_data.bubbleTimer = 8;
}
//  #endregion
//#endregion

setup();