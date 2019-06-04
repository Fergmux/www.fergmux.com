$(function(){
  window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
  })();

  var canvas = document.getElementById('myCanvas');
  var gl = initWebGL();
  reset();
  
  function initWebGL() {
    gl = null;
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("2d")
    // If we don't have a GL context, give up now
    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
    }
    return gl;
  }

  $( "#reset" ).click(function() {
    reset();
  });

  // reset slider values to defualt
  function reset() {
    $('#speed').val(6);
    $('#density').val(8);
    $('#width').val(4);
    $('#length').val(60);
    $('#random').prop("checked", false);
    $('#rainbow').prop("checked", false)
    $("#fg").val('#4B0082');
    $("#bg").val('#050505');
  }

  // create a drop and insert into drop array
  function makeDrop(drops, count) {
    var randVals = [];
    var width = parseInt($('#width').val());
    var length = parseInt($('#length').val());
    for (var i = 0; i < 6; i++) {
      randVals.push(Math.random());
    }
    if ($('#random').prop("checked")) {
      var c3 = Math.floor(randVals[3]*256).toString();
      var c4 = Math.floor(randVals[4]*256).toString();
      var c5 = Math.floor(randVals[5]*256).toString();
      var col = "rgb("+c3+", "+c4+", "+c5+")";
    } else if ($('#rainbow').prop("checked")) {
      var col = "hsl("+count.toString()+", 100%, 50%)";
    } else {
      var col = $("#fg").val();
    }
    var drop = {
      x: randVals[0]*canvas.width,
      y: -400,
      w: randVals[1]*width,
      l: randVals[2]*length+length,
      v: randVals[1]/2 + 0.5,
      c: col
    }
    drops.push(drop);
    return drops;
  }

  // draw a line passing in a drop object
  function drawLine(drop) {
    gl.beginPath();
    gl.moveTo(drop.x, drop.y);
    gl.lineTo(drop.x, drop.y+drop.l);
    gl.lineWidth = drop.w;
    gl.strokeStyle = drop.c;
    gl.stroke();
  }

  function drawLines(drops) {
    for (i in drops) {
      drawLine(drops[i]);
    }
  }

  // update the positions of all the drops
  function updateDrops(drops, time) {
    var liveDrops = [];
    var speed = $('#speed').val();
    for (i in drops) {
      var drop = drops[i]
      drop.y = drop.y + drop.v * time * speed/10;
      if (drop.y < canvas.height) {
        liveDrops.push(drop);
      }
    }
    return liveDrops;
  }

  // used to fit the density slider values to useful fractions of a second for drop creation
  var incs = [1,2,5,20,50,200,500];
  function animate(drops, startTime, prevTime, lastSpawn, count) {
    var elapsedTime = (new Date()).getTime() - startTime;
    
    // time since the previous loop started
    var deltaTime = elapsedTime - prevTime

    drops = updateDrops(drops, deltaTime);

    gl.fillStyle = $("#bg").val();
    gl.fillRect(0, 0, canvas.width, canvas.height);

    drawLines(drops);

    console.log(elapsedTime%50);

    var density = $("#density").val();

    // value on the density slider to switch from less than one to multiple drops per loop
    var switchPoint = 7;
    
    // time since the last drop was created
    var timeSince = elapsedTime - lastSpawn;

    // if density is less than one per animation loop, create drops at some rate
    if (density < switchPoint && timeSince > 1000/(incs[density])) {
      drops = makeDrop(drops, count);
      lastSpawn = elapsedTime;
    } else if (density >= switchPoint) {
      // else make multiple drops each animation loop
      var dropCount = density - switchPoint + 1;
      for (var i = 0; i < dropCount; i++) {
        drops = makeDrop(drops, count);
      }
      lastSpawn = elapsedTime;
    }
    
    count++;
    
    // request new frame
    requestAnimFrame(function() {
      animate(drops, startTime, elapsedTime, lastSpawn, count);
    });
  }

  // wait one second before starting animation
  setTimeout(function() {
    var startTime = (new Date()).getTime();
    animate([], startTime, startTime, 0, 0);
    
  }, 1000);

  var out = false;
  $( "#showbutton" ).click(function() {
    // if controls are currrently showing
    if (out) {
      var position = "-150px";
      var text = "Show";
      var showpacity = 0.3;
      out = false;
    } else {
      var position = "20px";
      var text = "Hide";
      var showpacity = 1;
      out = true;
    }
    // bring control panel into view
    $( "#controls" ).animate({
      right: position,
    }, 500);
    // hide or fade out 'show' button
    $( "#showbutton" ).animate({
      opacity: showpacity,
    }, 500);

    $( "#showbutton" ).text(text);
    $( "#reset" ).fadeToggle(500);

  });
});


