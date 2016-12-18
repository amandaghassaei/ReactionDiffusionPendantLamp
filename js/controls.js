/**
 * Created by ghassaei on 10/31/16.
 */


function initControls(){

    setLink("#about", function(){
        $('#aboutModal').modal('show');
    });

    function scaleCallBack(val){
        pentEdgeLength = val;
        var pentWidth = Math.ceil(1.62*pentEdgeLength*dpi);
        var pentHeight = Math.ceil(1.54*pentEdgeLength*dpi);
        $canvas.width(pentWidth);
        $canvas.height(pentHeight);

        width = pentWidth;
        height = pentHeight;

         gl.viewport(0, 0, width, height);

        // set the size of the texture
        gl.useProgram(stepProgram);
        gl.uniform2f(textureSizeLocation, width, height);
        gl.useProgram(renderProgram);
        gl.uniform2f(textureSizeLocationRender, width, height);

        reset();

        paused = false;
    }
    setSliderStopInput("scale", pentEdgeLength, 1, 100, 0.01, scaleCallBack);
    scaleCallBack(pentEdgeLength);

    setRadio("panelMode", panelModeSelection, function(val){
        panelModeSelection = val;
    });

    setSliderInput("#killRate", killRate, 0.045, 0.07, 0.001, function(val){
        killRate = val;
    });
    setSliderInput("#feedRate", feedRate, 0.01, 0.1, 0.001, function(val){
        feedRate = val;
    });

    setLink("#reset", reset);
    setLink("#play", function(){
        isPaused = false;
        $("#pause").show();
        $("#play").hide();
    });
    setLink("#pause", function(){
        isPaused = true;
        $("#pause").hide();
        $("#play").show();
    });

    $(window).keyup(function(e){
        if (e.keyCode == 32){
            isPaused = !isPaused;
            if (isPaused){
                $("#pause").hide();
                $("#play").show();
            } else {
                $("#pause").show();
                $("#play").hide();
            }
        }
    });


    function setLink(id, callback){
        $(id).click(function(e){
            e.preventDefault();
            callback(e);
        });
    }

    function setRadio(name, val, callback){
        $("input[name=" + name + "]").on('change', function() {
            var state = $("input[name="+name+"]:checked").val();
            callback(state);
        });
        $(".radio>input[value="+val+"]").prop("checked", true);
    }

    function setInput(id, val, callback, min, max){
        var $input = $(id);
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }
            if (min !== undefined && val < min) val = min;
            if (max !== undefined && val > max) val = max;
            $input.val(val);
            callback(val);
        });
        $input.val(val);
    }

    function setCheckbox(id, state, callback){
        var $input  = $(id);
        $input.on('change', function () {
            if ($input.is(":checked")) callback(true);
            else callback(false);
        });
        $input.prop('checked', state);
    }

    function setSlider(id, val, min, max, incr, callback, callbackOnStop){
        var slider = $(id).slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });
        slider.on("slide", function(e, ui){
            var val = ui.value;
            callback(val);
        });
        slider.on("slidestop", function(){
            var val = slider.slider('value');
            if (callbackOnStop) callbackOnStop(val);
        })
    }

    function setSliderInput(id, val, min, max, incr, callback){

        var slider = $(id+">div").slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });

        var $input = $(id+">input");
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }

            var min = slider.slider("option", "min");
            if (val < min) val = min;
            if (val > max) val = max;
            $input.val(val);
            slider.slider('value', val);
            callback(val);
        });
        $input.val(val);
        slider.on("slide", function(e, ui){
            var val = ui.value;
            $input.val(val);
            callback(val);
        });
    }

    function setSliderStopInput(id, val, min, max, incr, callback){

        var slider = $(id+">div").slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });

        var $input = $(id+">input");
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }

            var min = slider.slider("option", "min");
            if (val < min) val = min;
            if (val > max) val = max;
            $input.val(val);
            slider.slider('value', val);
            callback(val);
        });
        $input.val(val);
        slider.on("slidestop", function(e, ui){
            var val = ui.value;
            $input.val(val);
            callback(val);
        });
    }


    return {
    }
}