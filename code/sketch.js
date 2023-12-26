// Minecraft in P5.js
// Author: Amy Burnett
//========================================================================
// Globals

const BLOCK_WIDTH = 25;

// Block IDs that represent the different kinds of blocks
const BLOCK_ID_AIR        = 0;
const BLOCK_ID_GRASS      = 1;
const BLOCK_ID_DIRT       = 2;
const BLOCK_ID_STONE      = 3;
const BLOCK_ID_WATER      = 4;
const BLOCK_ID_SAND       = 5;

// this should be 256
const WORLD_HEIGHT = 50;
// this should be 65
const SEA_LEVEL = 20
// a chunk is a CHUNK_SIZE*CHUNK_SIZE*WORLD_HEIGHT subset of the full map
const CHUNK_SIZE = 4;

// 3D array that stores block ids for representing the world
// x, y, z
let blocks = [];

let camera;
const FOV_DEGREES = 90;

let overlay_graphics;
let overlay_font;

const DRAW_STYLE_NORMAL = 0;
const DRAW_STYLE_WIREFRAME = 1;
const DRAW_STYLE_NORMAL_WIREFRAME = 2;
const DRAW_STYLE_MAX = 3;
let current_draw_style = DRAW_STYLE_NORMAL;

const CAMERA_LOOK_SPEED = 0.02;
const CAMERA_RUN_LOOK_SPEED = 0.05;
const CAMERA_MOVEMENT_SPEED = 2;
const CAMERA_RUN_MOVEMENT_SPEED = 10;

// Key Press KeyCodes
const KEY_W = 'W'.charCodeAt (0);
const KEY_A = 'A'.charCodeAt (0);
const KEY_S = 'S'.charCodeAt (0);
const KEY_D = 'D'.charCodeAt (0);
const KEY_Q = 'Q'.charCodeAt (0);
const KEY_Z = 'Z'.charCodeAt (0);
const KEY_R = 'R'.charCodeAt (0);

//========================================================================

function preload ()
{
    overlay_font = loadFont ("assets/fonts/Inconsolata/Inconsolata.otf");
}

//========================================================================

function generate_terrain_for_chunk ()
{
    for (let x = 0; x < CHUNK_SIZE; ++x)
    {
        for (let z = 0; z < CHUNK_SIZE; ++z)
        {
            // use noise to determine where to place the surface
            let noise_scale = 0.06;
            let noise_range_low = 0;
            let noise_range_high = 1;
            let noise_range = noise_range_high - noise_range_low;
            let noise_value = noise (noise_scale * x, noise_scale * z);
            let sea_level = Math.round (WORLD_HEIGHT/2);
            let surface_height_range_low = sea_level - 8;
            let surface_height_range_high = sea_level + 8;
            let surface_height_range = surface_height_range_high - surface_height_range_low;
            let surface_height = Math.floor ((((noise_value - noise_range_low) * surface_height_range) / noise_range) + surface_height_range_low);
            // place grass at height if above water
            if (surface_height >= sea_level)
                // above sea level so make it grass
                blocks[x][surface_height][z] = BLOCK_ID_GRASS;
            else
                // underwater so make the surface sand
                blocks[x][surface_height][z] = BLOCK_ID_SAND;
            // place dirt below
            let num_dirt = 3;
            for (let d = 1; d <= num_dirt; ++d)
            {
                // ensure in bounds
                if (surface_height-d < 0)
                    break;
                // place dirt
                blocks[x][surface_height-d][z] = BLOCK_ID_DIRT;
            }
            // place stone below
            let y = surface_height-num_dirt-1;
            while (y >= 0)
            {
                // place stone
                blocks[x][y][z] = BLOCK_ID_STONE;
                // advance to next height
                --y;
            }
            // place water on top if below sea level
            y = surface_height+1;
            while (y <= sea_level)
            {
                blocks[x][y][z] = BLOCK_ID_WATER;
                ++y;
            }
        }
    }
}

//========================================================================

function setup ()
{
    createCanvas (windowWidth, windowHeight, WEBGL);

    angleMode (RADIANS);

    camera = createCamera ();
    perspective (radians (FOV_DEGREES), width / height, 0.1, 8000);

    // start with just one chunk of blocks
    // [ x ][ y ][ z ]
    // [col][row][dep]
    for (let x = 0; x < CHUNK_SIZE; ++x)
    {
        // add new col/x-value
        blocks.push ([]);
        for (let y = 0; y < WORLD_HEIGHT; ++y)
        {
            // add new row/y-value
            blocks[x].push ([]);
            for (let z = 0; z < CHUNK_SIZE; ++z)
            {
                // set new depth/z-value to air (ie no block)
                blocks[x][y].push (BLOCK_ID_AIR);
            }
        }
    }

    // generate terrain via perlin noise
    generate_terrain_for_chunk ();

    // Overlay
    overlay_graphics = createGraphics (100, 100);

}

//========================================================================

// draws a box face by face and omits faces that cannot be seen
function draw_block (x, y, z)
{
    push ();
    // move to block's center position
    translate (x*BLOCK_WIDTH, -y*BLOCK_WIDTH, z*BLOCK_WIDTH);

    // enable wireframe
    if (current_draw_style == DRAW_STYLE_NORMAL_WIREFRAME || current_draw_style == DRAW_STYLE_WIREFRAME)
    {
        stroke (0);
        strokeWeight (1);
    }
    // no wireframe
    else
        noStroke ();

    // front face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    let is_camera_infront_of_plane = camera.eyeZ >= z*BLOCK_WIDTH;
    let is_this_block_water = blocks[x][y][z] == BLOCK_ID_WATER;
    if ((z+1 >= CHUNK_SIZE || blocks[x][y][z+1] == BLOCK_ID_AIR || blocks[x][y][z+1] == BLOCK_ID_WATER) && is_camera_infront_of_plane)
    {
        push ();
        // move to plane's position
        translate (0, 0, BLOCK_WIDTH/2);
        plane (BLOCK_WIDTH, BLOCK_WIDTH);
        pop ();
    }

    // back face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    is_camera_infront_of_plane = camera.eyeZ <= z*BLOCK_WIDTH;
    if ((z-1 < 0 || blocks[x][y][z-1] == BLOCK_ID_AIR || blocks[x][y][z-1] == BLOCK_ID_WATER) && is_camera_infront_of_plane)
    {
        push ();
        translate (0, 0, -BLOCK_WIDTH/2);
        plane (BLOCK_WIDTH, BLOCK_WIDTH);
        pop ();
    }

    // left face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    is_camera_infront_of_plane = camera.eyeX <= x*BLOCK_WIDTH;
    if ((x-1 < 0 || blocks[x-1][y][z] == BLOCK_ID_AIR || blocks[x-1][y][z] == BLOCK_ID_WATER) && is_camera_infront_of_plane)
    {
        push ();
        rotateY (PI/2);
        translate (0, 0, -BLOCK_WIDTH/2);
        plane (BLOCK_WIDTH, BLOCK_WIDTH);
        pop ();
    }

    // right face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    is_camera_infront_of_plane = camera.eyeX >= x*BLOCK_WIDTH;
    if ((x+1 >= CHUNK_SIZE || blocks[x+1][y][z] == BLOCK_ID_AIR || blocks[x+1][y][z] == BLOCK_ID_WATER) && is_camera_infront_of_plane)
    {
        push ();
        rotateY (PI/2);
        translate (0, 0, BLOCK_WIDTH/2);
        plane (BLOCK_WIDTH, BLOCK_WIDTH);
        pop ();
    }

    // top face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    // is_camera_infront_of_plane = camera.eyeY >= y*BLOCK_WIDTH;
    // y axis needs to be reversed and negated
    is_camera_infront_of_plane = camera.eyeY <= -y*BLOCK_WIDTH;
    if ((y+1 >= WORLD_HEIGHT || blocks[x][y+1][z] == BLOCK_ID_AIR || blocks[x][y+1][z] == BLOCK_ID_WATER) && is_camera_infront_of_plane)
    {
        push ();
        rotateX (PI/2);
        translate (0, 0, BLOCK_WIDTH/2);
        plane (BLOCK_WIDTH, BLOCK_WIDTH);
        pop ();
    }
    
    // bottom face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    // is_camera_infront_of_plane = camera.eyeY <= y*BLOCK_WIDTH;
    // y axis needs to be reversed and negated
    is_camera_infront_of_plane = camera.eyeY >= -y*BLOCK_WIDTH;
    if ((y-1 < 0 || blocks[x][y-1][z] == BLOCK_ID_AIR || blocks[x][y-1][z] == BLOCK_ID_WATER) && is_camera_infront_of_plane)
    {
        push ();
        rotateX (PI/2);
        translate (0, 0, -BLOCK_WIDTH/2);
        plane (BLOCK_WIDTH, BLOCK_WIDTH);
        pop ();
    }

    pop ();
}

//========================================================================

function draw_chunk ()
{
    // loop over x direction
    for (let i = 0; i < CHUNK_SIZE; ++i)
    {
        // loop over y direction
        for (let j = 0; j < WORLD_HEIGHT; ++j)
        {
            // loop over z direction
            for (let k = 0; k < CHUNK_SIZE; ++k)
            {
                // draw block based on BLOCK_ID
                if (blocks[i][j][k] == BLOCK_ID_AIR)
                {
                    // draw nothing
                    
                    // // draw outline
                    // noFill ();
                    // box (BLOCK_WIDTH);
                }
                if (blocks[i][j][k] == BLOCK_ID_GRASS)
                {
                    fill ("lime");
                    // dont fill if the draw style is not normal
                    if (current_draw_style != DRAW_STYLE_NORMAL && current_draw_style != DRAW_STYLE_NORMAL_WIREFRAME)
                        noFill ();
                    draw_block (i,j,k);
                }
                if (blocks[i][j][k] == BLOCK_ID_DIRT)
                {
                    fill ("#964B00");
                    // dont fill if the draw style is not normal
                    if (current_draw_style != DRAW_STYLE_NORMAL && current_draw_style != DRAW_STYLE_NORMAL_WIREFRAME)
                        noFill ();
                    draw_block (i,j,k);
                }
                if (blocks[i][j][k] == BLOCK_ID_STONE)
                {
                    fill ("gray");
                    // dont fill if the draw style is not normal
                    if (current_draw_style != DRAW_STYLE_NORMAL && current_draw_style != DRAW_STYLE_NORMAL_WIREFRAME)
                        noFill ();
                    draw_block (i,j,k);
                }
                if (blocks[i][j][k] == BLOCK_ID_WATER)
                {
                    fill (50, 100, 255, 150);
                    // dont fill if the draw style is not normal
                    if (current_draw_style != DRAW_STYLE_NORMAL && current_draw_style != DRAW_STYLE_NORMAL_WIREFRAME)
                        noFill ();
                    draw_block (i,j,k);
                }
                if (blocks[i][j][k] == BLOCK_ID_SAND)
                {
                    fill ("#C2B280");
                    // dont fill if the draw style is not normal
                    if (current_draw_style != DRAW_STYLE_NORMAL && current_draw_style != DRAW_STYLE_NORMAL_WIREFRAME)
                        noFill ();
                    draw_block (i,j,k);
                }
            }
        }
    }
}

//========================================================================

function draw ()
{
    background (150, 200, 255);

    process_key_input ();
    
    // draw blocks
    draw_chunk ();

    // Draw overlay elements
    push ();
    {
        // get the camera's pan and tilt
        let pan = atan2(camera.eyeZ - camera.centerZ, camera.eyeX - camera.centerX)
        let tilt = atan2(camera.eyeY - camera.centerY, dist(camera.centerX, camera.centerZ, camera.eyeX, camera.eyeZ))
        
        // move to the camera's position to draw the overlay in front of the camera
        translate(camera.eyeX, camera.eyeY, camera.eyeZ)
        // rotate so that the overlay matches the pan and tilt of the camera
        rotateY(-pan)
        rotateZ(tilt + PI)
        translate(200, 0, 0)
        rotateY(-PI/2)
        rotateZ(PI)
        // FPS counter
        push ();
        {
            let fps = frameRate ();
            textSize (12);
            textFont (overlay_font);
            translate(-150, -150, 0);
            textAlign (LEFT);
            fill (255);
            text (Math.round (fps) + " FPS", 0, 0);
        }
        pop ();
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
    if (keyCode == KEY_R)
    {
        // go to next draw style
        // wrapping back to the first after the last draw
        current_draw_style = (current_draw_style + 1) % DRAW_STYLE_MAX;
    }
}