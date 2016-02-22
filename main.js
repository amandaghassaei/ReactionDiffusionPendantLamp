/**
 * Created by ghassaei on 2/20/16.
 */


var gl;
var canvas;
var frameBuffers;
var states = [null, null];

var resizedLastState;
var resizedCurrentState;

var width;
var height;

var flipYLocation;
var renderFlagLocation;
var textureSizeLocation;

var mouseCoordLocation;
var mouseEnableLocation;

var paused = false;//while window is resizing

window.onload = initGL;

function initGL() {

    // Get A WebGL context
    canvas = document.getElementById("glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    canvas.onmousemove = onMouseMove;
    canvas.onmouseout = onMouseOut;
    canvas.onmouseover = onMouseIn;

    window.onresize = onResize;

    gl = canvas.getContext("webgl", { antialias: false}) || canvas.getContext("experimental-webgl", { antialias: false});
    if (!gl) {
        alert('Could not initialize WebGL, try another browser');
        return;
    }

    gl.disable(gl.DEPTH_TEST);
    gl.getExtension('OES_texture_float');

    // setup a GLSL program
    var program = createProgramFromScripts(gl, "2d-vertex-shader", "2d-fragment-shader");
    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");

    // Create a buffer for positions
    var bufferPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferPos);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0]
        ), gl.STATIC_DRAW);


    //flip y
    flipYLocation = gl.getUniformLocation(program, "u_flipY");

    //renderflag
    renderFlagLocation = gl.getUniformLocation(program, "u_renderFlag");

    //set texture location
    var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    // provide texture coordinates for the rectangle.
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
    mouseCoordLocation = gl.getUniformLocation(program, "u_mouseCoord");
    mouseEnableLocation = gl.getUniformLocation(program, "u_mouseEnable");



    onResize();

    states[0] = resizedLastState;
    states[1] = resizedCurrentState;
    resizedLastState = null;
    resizedCurrentState = null;

    frameBuffers = [makeFrameBuffer(states[0]), makeFrameBuffer(states[1])];

    gl.bindTexture(gl.TEXTURE_2D, states[0]);//original texture

    render();
}

function makeFrameBuffer(state){
    var frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, state, 0);
    return frameBuffer;
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

    if (!paused) {

        //if (resizedLastState) {
        //    states[0] = resizedLastState;
        //    resizedLastState = null;
        //}
        //if (resizedCurrentState) {
        //    states[1] = resizedCurrentState;
        //    resizedCurrentState = null;
        //}

        gl.uniform1f(flipYLocation, 1);// don't y flip images while drawing to the textures
        gl.uniform1f(renderFlagLocation, 0);

        for (var i=0;i<40;i++) {
            step(i);
        }


        gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
        gl.uniform1f(renderFlagLocation, 1);//only plot position on render


        //draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, states[0]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }



    window.requestAnimationFrame(render);
}

function step(i){
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffers[(i+1)%2]);
    gl.bindTexture(gl.TEXTURE_2D, states[i%2]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer
}

function onResize(){
    paused = true;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    gl.viewport(0, 0, width, height);

    // set the size of the texture
    gl.uniform2f(textureSizeLocation, width, height);

    //texture for saving output from frag shader
    resizedCurrentState = makeTexture(gl, null);

    //fill with random pixels
    var rgba = new Float32Array(width*height*4);
    resizedLastState = makeTexture(gl, makeRandomArray(rgba));

    paused = false;
}

function onMouseMove(e){
    gl.uniform2f(mouseCoordLocation, e.clientX/width, e.clientY/height);
}

function onMouseOut(){
    gl.uniform1f(mouseEnableLocation, 0);
}

function onMouseIn(){
    gl.uniform1f(mouseEnableLocation, 1);
}