// Minecraft in P5.js
// Author: Amy Burnett
//========================================================================
// Globals

let player;

let overlay_graphics;
let overlay_font;

// Key Press KeyCodes
const KEY_W = 'W'.charCodeAt (0);
const KEY_A = 'A'.charCodeAt (0);
const KEY_S = 'S'.charCodeAt (0);
const KEY_D = 'D'.charCodeAt (0);
const KEY_Q = 'Q'.charCodeAt (0);
const KEY_Z = 'Z'.charCodeAt (0);
const KEY_T = 'T'.charCodeAt (0);
const KEY_G = 'G'.charCodeAt (0);
const KEY_SPACEBAR = ' '.charCodeAt (0);

let texture_atlas;

let texture_null;
let texture_dirt;
let texture_grass_side;
let texture_grass_top;
let texture_sand;
let texture_stone;
let texture_water;

let is_game_paused = false;

let world;

// used to calculate average fps
let prev_fps = [];

//========================================================================

function preload ()
{
    overlay_font = loadFont ("assets/fonts/Inconsolata/Inconsolata.otf");
    texture_atlas = loadImage ("assets/block_texture_atlas.png");

    texture_null       = loadImage ("assets/texture_null.png");
    texture_dirt       = loadImage ("assets/texture_dirt.png");
    texture_grass_side = loadImage ("assets/texture_grass_side.png");
    texture_grass_top  = loadImage ("assets/texture_grass_top.png");
    texture_sand       = loadImage ("assets/texture_sand.png");
    texture_stone      = loadImage ("assets/texture_stone.png");
    texture_water      = loadImage ("assets/texture_water.png");

}

//========================================================================

function setup ()
{
    createCanvas (windowWidth, windowHeight, WEBGL);

    angleMode (RADIANS);

    // setup player
    player = new Player (createCamera ());
    perspective (radians (FOV_DEGREES), width / height, 0.1, 8000);
    // move player to the first chunk
    player.set_position (0, -WORLD_HEIGHT*BLOCK_WIDTH, 0);

    // Initialize the world
    world = new World ();

    // Overlay
    overlay_graphics = createGraphics (100, 100);

    // setup block textures and other static block info
    block_setup ();

    // start the game paused
    is_game_paused = true;

}

//========================================================================

function draw ()
{
    background (150, 200, 255);

    process_key_input ();

    player.update ();
    player.draw ();
    
    // setup light from Sun
    ambientLight (128, 128, 128);
    directionalLight (128, 128, 128, 0, 1, -1);
    
    // draw world
    world.draw ();

    // draw overlay elements
    draw_overlay ();
}

//========================================================================

function draw_overlay ()
{

    push ();
    {
        // get the camera's pan and tilt
        let pan = atan2 (player.camera.eyeZ - player.camera.centerZ, player.camera.eyeX - player.camera.centerX);
        let tilt = atan2 (player.camera.eyeY - player.camera.centerY, dist (player.camera.centerX, player.camera.centerZ, player.camera.eyeX, player.camera.eyeZ));
        
        // move to the camera's position to draw the overlay in front of the camera
        translate (player.camera.eyeX, player.camera.eyeY, player.camera.eyeZ);
        // rotate so that the overlay matches the pan and tilt of the camera
        rotateY (-pan);
        rotateZ (tilt + PI);
        translate (200, 0, 0);
        rotateY (-PI/2);
        rotateZ (PI);
        // left panel debug text
        push ();
        {
            // style
            textSize (10);
            textFont (overlay_font);
            translate(-150, -150, 0);
            textAlign (LEFT);
            fill (255);
            // load data
            let fps = frameRate ();
            prev_fps.push (fps);
            if (prev_fps.length > 100)
                prev_fps = prev_fps.slice (1, prev_fps.length);
            let fps_ave = prev_fps.reduce ((a,b)=>{return a+b}) / prev_fps.length;
            let frame_time = 1000 / fps;
            let frame_time_ave = 1000 / fps_ave;
            let x = Math.floor (player.position.x * 100) / 100;
            let y = Math.floor (player.position.y * 100) / 100;
            let z = Math.floor (player.position.z * 100) / 100;
            let tilt = Math.floor (player.tilt_amount * 100) / 100;
            let pan = Math.floor (player.pan_amount * 100) / 100;
            let [block_x, block_y, block_z] = convert_world_to_block_coords (player.position.x, player.position.y, player.position.z);
            block_x = Math.floor (block_x * 100) / 100;
            block_y = Math.floor (block_y * 100) / 100;
            block_z = Math.floor (block_z * 100) / 100;
            let [block_xi, block_yi, block_zi] = convert_world_to_block_index (player.position.x, player.position.y, player.position.z);
            block_xi = Math.floor (block_xi * 100) / 100;
            block_yi = Math.floor (block_yi * 100) / 100;
            block_zi = Math.floor (block_zi * 100) / 100;
            let [chunk_xi, chunk_yi, chunk_zi] = convert_world_to_chunk_index (player.position.x, player.position.y, player.position.z);
            let [chunk_block_xi, chunk_block_yi, chunk_block_zi] = convert_world_to_chunk_block_index (player.position.x, player.position.y, player.position.z);
            let block_type = world.get_block_type (block_xi, block_yi, block_zi);
            let block_type_str = BLOCK_ID_STR_MAP.get (block_type);
            // draw debug text
            text (`FPS: ${fps.toFixed (0)}, Ave: ${fps_ave.toFixed (0)}\n` +
                  `frame time (ms): ${frame_time.toFixed (2)}, Ave: ${frame_time_ave.toFixed (2)}\n` +
                  `tilt:       ${tilt.toFixed (2)} (RAD), ${degrees (tilt).toFixed (2)} (DEG)\n` +
                  `pan:        ${pan.toFixed (2)} (RAD), ${degrees (pan).toFixed (2)} (DEG)\n` +
                  `XYZ:        ${x}, ${y}, ${z}\n` +
                  `block:      ${block_x}, ${block_y}, ${block_z}\n` +
                  `block_idx:  ${block_xi}, ${block_yi}, ${block_zi}\n` +
                  `chunk_idx:  ${chunk_xi}, ${chunk_yi}, ${chunk_zi}\n` +
                  `chunk_block_idx: ${chunk_block_xi}, ${chunk_block_yi}, ${chunk_block_zi}\n` +
                  `block id:   ${block_type_str}\n` +
                  `draw_style: ${DRAW_STYLE_STR_MAP.get (current_draw_style)}`,
                  0, 0);
        }
        pop ();
        // draw paused text, if paused
        if (is_game_paused)
        {
            push ();
            // darken background
            fill (0, 0, 0, 175);
            rectMode (CENTER);
            rect (0, 0, windowWidth, windowHeight);
            // draw paused message
            textSize (24);
            textFont (overlay_font);
            textAlign (CENTER);
            fill (255);
            text ("Paused", 0, 0);
            textSize (10);
            text ("Click anywhere to resume", 0, 24);
            pop ();
            // freeze game
            // we freeze here to ensure we have the paused message
            // before the game stops drawing
            noLoop ();
        }

    }
    pop ();
}

//========================================================================

// handle keyboard input that is held down
function process_key_input ()
{
    // Camera looking
    let speed = CAMERA_LOOK_SPEED;
    if (keyIsDown (SHIFT))
        speed = CAMERA_RUN_LOOK_SPEED;
    // scale with time so that it does not change with frameRate
    speed *= deltaTime;
    if (keyIsDown (UP_ARROW))
    {
        player.tilt (-speed);
    }
    if (keyIsDown (RIGHT_ARROW))
    {
        player.pan (speed);
    }
    if (keyIsDown (DOWN_ARROW))
    {
        player.tilt (speed);
    }
    if (keyIsDown (LEFT_ARROW))
    {
        player.pan (-speed);
    }

    // camera movement
    speed = CAMERA_MOVEMENT_SPEED;
    if (keyIsDown (SHIFT))
        speed = CAMERA_RUN_MOVEMENT_SPEED;
    // scale with time so that it does not change with frameRate
    speed *= deltaTime;
    // move forwards
    if (keyIsDown (KEY_W))
    {
        player.move_z (speed);
    }
    // move backwards
    if (keyIsDown (KEY_S))
    {
        player.move_z (-speed);
    }
    // move left
    if (keyIsDown (KEY_A))
    {
        player.move_x (speed);
    }
    // move right
    if (keyIsDown (KEY_D))
    {
        player.move_x (-speed);
    }
    // move up
    if (keyIsDown (KEY_Q))
    {
        player.move_y (-speed);
    }
    // move down
    if (keyIsDown (KEY_Z))
    {
        player.move_y (speed);
    }

    if (keyIsDown (KEY_SPACEBAR))
    {
        player.jump ();
    }

}

//========================================================================

// called once when a key is pressed down
// does not call repeatedly if key is held down
function keyPressed ()
{
    // change block style
    if (keyCode == KEY_T)
    {
        // go to next draw style
        // wrapping back to the first after the last draw
        current_draw_style = (current_draw_style + 1) % DRAW_STYLE_MAX;
    }
    // toggle chunk debug grid lines
    if (keyCode == KEY_G)
    {
        is_chunk_debug_border_shown = !is_chunk_debug_border_shown;
    }
    // pause game
    // I think the pointer lock hijacks this so we actually need to double-click
    // ESCAPE to pause the game
    if (keyCode == ESCAPE)
    {
        is_game_paused = true;
    }
    // tab out of game
    // pause as well since tabbing-out will pull the cursor out of lock
    if (keyCode == TAB)
    {
        is_game_paused = true;
    }
}

//========================================================================

function mousePressed ()
{
    // we need to first exit pointer lock in-case the cursor
    // somehow got out of the lock
    exitPointerLock ();
    // resume the game (if it wasnt already running)
    is_game_paused = false;
    requestPointerLock ();
    loop ();
}

//========================================================================

