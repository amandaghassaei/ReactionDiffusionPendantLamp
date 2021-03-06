/**
 * Created by ghassaei on 2/20/16.
 */


//used a lot of ideas from https://bl.ocks.org/robinhouston/ed597847175cf692ecce to clean this code up

var gl;
var canvas, $canvas;
var frameBuffers;
var states = [null, null];

var resizedLastState;
var resizedCurrentState;

var pentRadius = 3;// inches

var isPaused = false;

var panelModeSelection = "pentagon";
var killRate = 0.062;
var feedRate = 0.0545;
var patternScale = 1;

var vortexMag = 1;
var vortexInnerRad = 0.2;
var vortexOuterRad = 0.8;

var killRateLocation, feedRateLocation, patternScaleLocation;
var vortexMagLocation, vortexInnerRadLocation, vortexOuterRadLocation;

var width;
var height;

var stepProgram;
var renderProgram;

var textureSizeLocation;
var textureSizeLocationRender;

var mouseCoordLocation;
var mouseCoordinates =  [null, null];
var mouseEnableLocation;
var mouseEnable = false;

var scaleFactor = 1;

$(function(){

    // Get A WebGL context
    canvas = document.getElementById("glcanvas");
    $canvas = $("#glcanvas");

    gl = canvas.getContext("webgl", {antialias:false}) || canvas.getContext("experimental-webgl", {antialias:false});
    if (!gl) {
        alert('Could not initialize WebGL, try another browser');
        return;
    }

    gl.disable(gl.DEPTH_TEST);
    gl.getExtension('OES_texture_float');

    // setup a GLSL program
    stepProgram = createProgramFromScripts(gl, "2d-vertex-shader", "2d-fragment-shader");
    renderProgram = createProgramFromScripts(gl, "2d-vertex-shader", "2d-render-shader");
    gl.useProgram(renderProgram);
    loadVertexData(gl, renderProgram);
    textureSizeLocationRender = gl.getUniformLocation(renderProgram, "u_textureSize");
    gl.useProgram(stepProgram);
    loadVertexData(gl, stepProgram);

    textureSizeLocation = gl.getUniformLocation(stepProgram, "u_textureSize");
    mouseCoordLocation = gl.getUniformLocation(stepProgram, "u_mouseCoord");
    mouseEnableLocation = gl.getUniformLocation(stepProgram, "u_mouseEnable");
    killRateLocation = gl.getUniformLocation(stepProgram, "u_killRate");
    feedRateLocation = gl.getUniformLocation(stepProgram, "u_feedRate");
    patternScaleLocation = gl.getUniformLocation(stepProgram, "u_patternScale");
    vortexMagLocation = gl.getUniformLocation(stepProgram, "u_vortexMag");
    vortexInnerRadLocation = gl.getUniformLocation(stepProgram, "u_vortexInnerRad");
    vortexOuterRadLocation = gl.getUniformLocation(stepProgram, "u_vortexOuterRad");

    frameBuffers = [makeFrameBuffer(), makeFrameBuffer()];

    var dim = 500;
    $canvas.width(dim);
    $canvas.height(dim);

    width = dim*scaleFactor;
    height = dim*scaleFactor;

    gl.viewport(0, 0, width, height);

    // set the size of the texture
    gl.useProgram(stepProgram);
    gl.uniform2f(textureSizeLocation, width, height);
    gl.useProgram(renderProgram);
    gl.uniform2f(textureSizeLocationRender, width, height);

    reset();

    initControls();

    canvas.onmousemove = onMouseMove;
    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;

    canvas.width = canvas.clientWidth*scaleFactor;
    canvas.height = canvas.clientHeight*scaleFactor;

    gl.bindTexture(gl.TEXTURE_2D, states[0]);//original texture

    render();
});

function loadVertexData(gl, program) {
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.95105651629, 0.30901699437, -0.58778525229,-0.80901699437, 0, 1, 0.58778525229,-0.80901699437, 0.95105651629, 0.30901699437]), gl.STATIC_DRAW);

    // look up where the vertex data needs to go.
	var positionLocation = gl.getAttribLocation(program, "a_position");
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
}

function makeFrameBuffer(){
    return gl.createFramebuffer();
}

function makeRandomArray(rgba){
    for (var x=0;x<width;x++) {
        for (var y=0;y<height;y++) {
            var ii = (y*width + x) * 4;
			var central_square = (x > width/2-10 && x < width/2+10 && y > height/2-10 && y < height/2+10);
			if (central_square) {
				rgba[ii] = 0.5 + Math.random() * 0.02 - 0.01;
				rgba[ii + 1] = 0.25 + Math.random() * 0.02 - 0.01;
			} else {
				rgba[ii] = 1.0;
				rgba[ii + 1] = 0;
			}
        }
    }
    return rgba;
}

function makeTexture(gl, data){

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, data);

    return texture;
}

function render(){

    if (!isPaused) {

        gl.useProgram(stepProgram);

        if (mouseEnable){
            gl.uniform1f(mouseEnableLocation, 1);
            gl.uniform2f(mouseCoordLocation, mouseCoordinates[0], mouseCoordinates[1]);
        } else gl.uniform1f(mouseEnableLocation, 0);

        if (resizedLastState) {
            states[0] = resizedLastState;
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffers[0]);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, states[0], 0);
            resizedLastState = null;
        }
        if (resizedCurrentState) {
            states[1] = resizedCurrentState;
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffers[1]);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, states[1], 0);
            resizedCurrentState = null;
        }

        gl.uniform1f(killRateLocation, killRate);
        gl.uniform1f(feedRateLocation, feedRate);
        gl.uniform1f(patternScaleLocation, patternScale);
        gl.uniform1f(vortexMagLocation, vortexMag);
        gl.uniform1f(vortexInnerRadLocation, vortexInnerRad);
        gl.uniform1f(vortexOuterRadLocation, vortexOuterRad);

        for (var i=0;i<40;i++) {
            if (isPaused) {
                window.requestAnimationFrame(render);
                return;
            }

            step(i);
        }

        gl.useProgram(renderProgram);

        //draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, states[0]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 5);

    }

    window.requestAnimationFrame(render);
}

function step(i){
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffers[(i+1)%2]);
    gl.bindTexture(gl.TEXTURE_2D, states[i%2]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 5);//draw to framebuffer
}


function reset(){
    //texture for saving output from frag shader
    resizedCurrentState = makeTexture(gl, null);

    //fill with random pixels
    var rgba = new Float32Array(width*height*4);
    resizedLastState = makeTexture(gl, makeRandomArray(rgba));
}

function onMouseMove(e){
    mouseCoordinates = [e.clientX, height-e.clientY];
}

function onMouseDown(){
    mouseEnable = 1;
}

function onMouseUp(){
    mouseEnable = 0;
}