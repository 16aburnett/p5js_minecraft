// Minecraft in P5.js
// Author: Amy Burnett
//========================================================================
// Globals

// this should be 256
const WORLD_HEIGHT = 50;
// this should be 65
const SEA_LEVEL = 20
// a chunk is a CHUNK_SIZE*CHUNK_SIZE*WORLD_HEIGHT subset of the full map
const CHUNK_SIZE = 16;

let camera;
const FOV_DEGREES = 90;

let overlay_graphics;
let overlay_font;

const CAMERA_LOOK_SPEED = 0.001;
const CAMERA_RUN_LOOK_SPEED = CAMERA_LOOK_SPEED*2;
const CAMERA_MOVEMENT_SPEED = 0.1;
const CAMERA_RUN_MOVEMENT_SPEED = CAMERA_MOVEMENT_SPEED*2;

// Key Press KeyCodes
const KEY_W = 'W'.charCodeAt (0);
const KEY_A = 'A'.charCodeAt (0);
const KEY_S = 'S'.charCodeAt (0);
const KEY_D = 'D'.charCodeAt (0);
const KEY_Q = 'Q'.charCodeAt (0);
const KEY_Z = 'Z'.charCodeAt (0);
const KEY_T = 'T'.charCodeAt (0);
const KEY_G = 'G'.charCodeAt (0);

let texture_atlas;

let texture_null;
let texture_dirt;
let texture_grass_side;
let texture_grass_top;
let texture_sand;
let texture_stone;
let texture_water;

let is_game_paused = false;

// quick access map of the currently loaded chunks
// this enables quick lookup using the chunk_xi and chunk_zi indices
let chunk_map;

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

    camera = createCamera ();
    perspective (radians (FOV_DEGREES), width / height, 0.1, 8000);

    // initialize the chunk map
    chunk_map = new Map ();
    chunk_map.set ("0,0", new Chunk (0, 0, 0));
    chunk_map.set ("0,1", new Chunk (0, 0, 1));
    chunk_map.set ("1,0", new Chunk (1, 0, 0));
    chunk_map.set ("1,1", new Chunk (1, 0, 1));

    // Overlay
    overlay_graphics = createGraphics (100, 100);

    // setup block textures
    block_setup ();

    // start the game paused
    is_game_paused = true;

}

//========================================================================

function draw ()
{
    background (150, 200, 255);

    process_key_input ();
    
    // setup light from Sun
    ambientLight (128, 128, 128);
    directionalLight (128, 128, 128, 0, 1, -1);
    
    // draw chunks
    // we need to split up the solid blocks and transparent blocks
    // because of weird draw order issues
    // these issues are resolved by first drawing all the solid blocks
    // and then drawing all the transparent blocks so that solid blocks
    // can be seen through the transparent blocks.
    // draw solid blocks of each chunk
    for (let chunk of chunk_map.values ())
        chunk.draw_solid_blocks ();
    // draw transparent blocks of each chunk
    for (let chunk of chunk_map.values ())
        chunk.draw_transparent_blocks ();

    // draw overlay elements
    draw_overlay ();
}

//========================================================================

function draw_overlay ()
{

    push ();
    {
        // get the camera's pan and tilt
        let pan = atan2 (camera.eyeZ - camera.centerZ, camera.eyeX - camera.centerX);
        let tilt = atan2 (camera.eyeY - camera.centerY, dist (camera.centerX, camera.centerZ, camera.eyeX, camera.eyeZ));
        
        // move to the camera's position to draw the overlay in front of the camera
        translate (camera.eyeX, camera.eyeY, camera.eyeZ);
        // rotate so that the overlay matches the pan and tilt of the camera
        rotateY (-pan);
        rotateZ (tilt + PI);
        translate (200, 0, 0);
        rotateY (-PI/2);
        rotateZ (PI);
        // FPS counter
        push ();
        {
            let fps = frameRate ();
            textSize (10);
            textFont (overlay_font);
            translate(-150, -150, 0);
            textAlign (LEFT);
            fill (255);
            text (`${Math.round (fps)} FPS`, 0, 0);
        }
        pop ();
        // camera position
        push ();
        {
            textSize (10);
            textFont (overlay_font);
            translate(-150, -130, 0);
            textAlign (LEFT);
            fill (255);
            let cam_x = Math.trunc (camera.eyeX * 100) / 100;
            let cam_y = Math.trunc (camera.eyeY * 100) / 100;
            let cam_z = Math.trunc (camera.eyeZ * 100) / 100;
            let block_x = Math.trunc ( camera.eyeX / BLOCK_WIDTH * 100) / 100;
            // y needs to be negated because P5js' y axis is flipped relative to normal conventions
            let block_y = Math.trunc (-camera.eyeY / BLOCK_WIDTH * 100) / 100;
            let block_z = Math.trunc ( camera.eyeZ / BLOCK_WIDTH * 100) / 100;
            let chunk_x = Math.floor ( camera.eyeX / BLOCK_WIDTH / CHUNK_SIZE);
            // chunk y position should always be 0 bc chunks dont stack verically
            let chunk_y = 0;
            let chunk_z = Math.floor ( camera.eyeZ / BLOCK_WIDTH / CHUNK_SIZE);
            text (`x:  ${block_x} (Block), ${cam_x} (Real), ${chunk_x} (Chunk)\n` +
                  `y:  ${block_y} (Block), ${cam_y} (Real), ${chunk_y} (Chunk)\n` +
                  `z:  ${block_z} (Block), ${cam_z} (Real), ${chunk_z} (Chunk)`,
                  0, 0);
        }
        pop ();
        // draw style
        push ();
        {
            textSize (10);
            textFont (overlay_font);
            translate(-150, -80, 0);
            textAlign (LEFT);
            fill (255);
            text (`draw_style: ${DRAW_STYLE_STR_MAP.get (current_draw_style)}`, 0, 0);
        }
        pop ();
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
            translate(0, 0, 0);
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
        camera.tilt (-speed);
    }
    if (keyIsDown (RIGHT_ARROW))
    {
        camera.pan (-speed);
    }
    if (keyIsDown (DOWN_ARROW))
    {
        camera.tilt (speed);
    }
    if (keyIsDown (LEFT_ARROW))
    {
        camera.pan (speed);
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
        camera.move (0, 0, -speed);
    }
    // move backwards
    if (keyIsDown (KEY_S))
    {
        camera.move (0, 0, speed);
    }
    // move left
    if (keyIsDown (KEY_A))
    {
        camera.move (-speed, 0, 0);
    }
    // move right
    if (keyIsDown (KEY_D))
    {
        camera.move (speed, 0, 0);
    }
    // move up
    if (keyIsDown (KEY_Q))
    {
        camera.move (0, -speed, 0);
    }
    // move down
    if (keyIsDown (KEY_Z))
    {
        camera.move (0, speed, 0);
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