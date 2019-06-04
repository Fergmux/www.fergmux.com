$(function(){  


  function initWebGL() {
    var gl = null;
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("2d")
    // If we don't have a GL context, give up now
    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
    }
    return gl;
  }

  var canvas = document.getElementById('mycanvas');
  var gl = initWebGL();
  var mousePos;           // make mouse position global
  var run = 0;            // run iteration (game running when odd)
  var score = [0,0];      // track game score [player, AI]
  var margin = 50;        // margin of paddle to edge of field
  var paddleWidth = 8;    // width of the paddle
  var paddleHeight = 40;  // height of the paddle


  //reset the field
  function reset() {
    // clear whole screen
    gl.clearRect(0, 0, canvas.width, canvas.height); 

    drawField();
    
    // set max speeed of the ball
    var maxspeed = 10;
    // set horizontal speed
    var xspeed =  Math.sign(Math.random() - 0.5) * maxspeed; 
    // generate random vertical speed
    var yspeed = Math.sign(Math.random() - 0.5) * Math.floor(Math.random() * (maxspeed));
    // set default right paddle position
    var pady = [canvas.height/2, 0]; 

    // the main ball object
    var ball = {
      x: canvas.width/2,                    // set x position to middle of field
      y: Math.floor(100+Math.random()*300), // randomise start position
      w: 8,                                 // set width of the ball
      v: maxspeed,
      vx: xspeed,
      vy: yspeed,
      top : function() { 
        return (this.y - this.w/2); // work out the y coord of the top edge of the ball
      },
      right : function() { 
        return (this.x + this.w/2); // work out the x coord of the right egde of the ball
      },
      bot : function() { 
        return (this.y + this.w/2); // work out the y coord of the bottom edge of the ball
      },
      left : function() { 
        return (this.x - this.w/2); // work out the x coord of the left side of the ball
      }
    };

    drawField(); 
    drawScore(); 
    drawPaddle(true, pady[0]);      // draw the right paddle
    drawPaddle(false, mousePos.y);  // draw the player paddle at the mouse location
    return [ball,pady]
  }


  // listen for mouse click
  canvas.addEventListener("click", function (evt) {
    if (run % 2 == 0) {         // if the games not running
      run++;                    // set the game to be running
      var res = reset();        // reset the field
      animate(res[0], res[1]);  // start animation
    }
  }, false);


  // get the mouse position whenever it moves and update global variable
  canvas.addEventListener("mousemove", function (evt) {
      mousePos = getMousePos(evt);
  }, false);


  //Get Mouse Position
  function getMousePos(evt) {
      var rect = canvas.getBoundingClientRect();
      return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
      };
  }


  // draw the scores to screen
  function drawScore() {
    // set fontsize
    var fontsize = 60; 
    // size of area to clear
    var clear = fontsize*2;
    // clear left score
    gl.clearRect(canvas.width / 4 - clear, canvas.height / 4 - clear, clear * 2, clear * 2);
    // clear right score area
    gl.clearRect(canvas.width / 4 * 3 - clear, canvas.height / 4 - clear, clear * 2, clear * 2);
    gl.font = fontsize.toString()+"px pong";
    gl.fillStyle = 'white';
    gl.textAlign = "center";
    // draw left score
    gl.fillText(score[0].toString(), canvas.width/4, canvas.height/4); 
    // draw right score
    gl.fillText(score[1].toString(), canvas.width/4 * 3, canvas.height/4); 
    return;
  }


  // wait one second before starting animation
  setTimeout(function() {
    if (run == 0) {reset();}
  }, 1000);


  // draw the background lines
  function drawField() {
    var w = 3
    var segments = [w*3,w*3];
    
    gl.setLineDash(segments);
    gl.beginPath();
    gl.moveTo(canvas.width/2-w/2, w/2); // centre of field, offset a little to centre segments nicely
    gl.lineTo(canvas.width/2-w/2, canvas.height); // centre of field bottom of field
    gl.lineWidth = w;
    gl.strokeStyle = 'white';
    gl.stroke();
    return;
  }


  // limit a y coordinate to be within paddle range
  function limitPos(pos) {
    if (pos < paddleHeight/2) {
      pos = paddleHeight/2; 
    } else if (pos > canvas.height - paddleHeight/2) {
      pos = canvas.height - paddleHeight/2;
    }
    return pos;
  }

  // get the new position of the ball
  function getBallPos(ball) {
    if (ball.top() < 0 || ball.bot() > canvas.height) { // if ball goes off the top or bottom
      ball.vy = -ball.vy; // bounce the ball
      playSound('boop');  // boop the bounce
    }
    ball.x = ball.x + ball.vx; 
    ball.y = ball.y + ball.vy; // add x/y velocitiies
    return ball;
  }


  // get the position of the right paddle
  function getPaddlePos(ball, pady) {
    var pv = 6;                   // set velocity of the paddle
    if (ball.vx < 0) {            // if the ball is travelling right
      var dest = canvas.height/2  // set destenation to centre position
    } else {
      var padx = canvas.width - margin - paddleWidth; // x position of paddle
      var xdif = padx - ball.x;                       // distance between ball and paddle
      var angl = Math.atan(ball.vy/ball.vx);          // angle of travel of the ball
      var ydif = Math.tan(angl) * xdif;               // difference between ball and ball destination
      var dest = ball.y + (ydif) + pady[1];           // absolute ball destination
    }

    dest = limitPos(dest)         // cap travel of the paddles
    var ydif = dest - pady[0];    // distance between paddle and ball destination
    if (Math.abs(ydif) > pv) {    // if the distance is less than the paddle velocity increment don't move the paddle
      var dir = Math.sign(ydif);  // otherwise work out if it's going to be above or below the paddle
      pady[0] = pady[0] + dir*pv; // move the paddle one speed increment in that direction
    }

    // return new paddle position
    return pady;
  }


  // check if the ball collides with a paddle
  function checkPaddleHit(ball, pady) {
    if (ball.vx < 0) {                    // if the ball is travelling left
      var padd = mousePos.y;              // set paddle height to mouse position
      padd = limitPos(padd);              // limit the paddle position
      var edge = ball.left()              // left side of the ball
      var pleft = margin;                 // left side of the left paddle
      var pright = pleft + paddleWidth;   // right side of the right paddle
      
    } else {
      var padd = pady[0]
      var edge = ball.right()             // right side of the ball
      var pright = canvas.width - margin; // right side of the right paddle
      var pleft = pright - paddleWidth;   // left side of the right paddle
    }

    var ptop = padd - paddleHeight/2;     // top of the right paddle
    var pbot = ptop + paddleHeight;       // bottom of the right paddle
    
    // if the colliding edge of the ball is between the left and right side of the paddle
    // and any portion of the ball lies between the top and bottom edges of the paddle
    if (edge <= pright && edge >= pleft && ball.top() < pbot && ball.bot() > ptop) {
      // then bounce the ball
      ball.vx = -ball.vx;
      // set the velocity of the ball to the offset from the centre of the paddle
      ball.vy = Math.floor((ball.y-padd)/(paddleHeight/2)*ball.v);

      // create the random offset for next time
      pady[1] = Math.floor(Math.random()-0.5)*(paddleHeight-ball.w/2)/2;
      // boop the bounce
      playSound('boop');
    }
    
    return [ball, pady];
  }


  // play a sound, take input as filename
  function playSound(sound) {
    var audio = new Audio('resources/audio/'+sound+'.ogg');
    audio.play();  
    return;
  }


  // check wether the ball hits either side
  function checkScore(ball) {
    if (ball.x > canvas.width) {  // if left scores
      score[0] = score[0] + 1;    // update the score
      run++;                      // stop game running
      playSound('beep');          // beep the goal
    } else if (ball.x < 0) {      // if right scores
      score[1] = score[1] + 1;    // update the scores
      run++;                      // stop the game running
      playSound('beep');          // beep the goal
    }
    drawScore();                  // redraw the scores
    return;
  }

  // draw the ball
  function drawBall(ball) {
    gl.fillStyle = 'white';
    gl.fillRect(ball.left(), ball.top(), ball.w, ball.w);
    return;
  }


  // draw a paddle, pass in true for right paddle
  function drawPaddle(right, y) {
    // if right paddle set mergin correctly
    var x = right ? canvas.width - margin - paddleWidth : margin;
    y = limitPos(y);
    gl.fillStyle = 'white';
    gl.fillRect(x, y-paddleHeight/2, paddleWidth, paddleHeight);
    return;
  }


  // main animation loop
  function animate(ball, pady) {
    
    // clear left paddle area
    gl.clearRect(margin, 0, paddleWidth, canvas.height); 
    // clear right paddle area
    gl.clearRect(canvas.width-margin-paddleWidth, 0, paddleWidth, canvas.height); 
    // clear where the ball just was
    gl.clearRect(ball.left(), ball.top(), ball.w, ball.w); 

    // if the ball passed over the centre line
    if (ball.x > canvas.width/2 - 10 && ball.x < canvas.width/2 + 10) { 
      drawField();  // redraw the centre line
    }

    ball = getBallPos(ball);              // update position of the ball
    pady = getPaddlePos(ball, pady);      // update position of the right paddle
    var ret = checkPaddleHit(ball, pady); // check if the ball has collided
    ball = ret[0]
    pady = ret[1]

    checkScore(ball);                     // check if anyone scored
    
    if (ball.y < 200) {                   // if ball is in the region of the scores
      drawScore();                        // redraw them
    }
    
    drawBall(ball);                       // draw the ball
    drawPaddle(true, pady[0]);            // draw the right paddle
    drawPaddle(false, mousePos.y);        // draw the player paddle at the mouse location

    if (run%2 == 0) {                     // if run not set
      return;                             // end execution
    }

    // wait a bit before calling the next frame
    setTimeout(function() { 
      animate(ball, pady);
    }, 20);
  }
});
