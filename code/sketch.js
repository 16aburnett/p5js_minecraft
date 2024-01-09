// Minecraft in P5.js
// Author: Amy Burnett
//========================================================================
// Globals

let player;
// keep track of the block that the player is pointing at
let current_pointed_at_block = null;
let pointed_at_block_neighbor = null;

let is_in_debug_mode = true;

// Creative mode
// - instantly break blocks
// - placing blocks does not consume them
// - allows flying
const PLAYER_MODE_CREATIVE = 0;
// Survival mode
// - **not yet implemented
// - takes time to break blocks
// - placing blocks consumes inventory resources
const PLAYER_MODE_SURVIVAL = 1;
const PLAYER_MODE_MAX      = 2;
const PLAYER_MODE_STR_MAP = new Map ();
PLAYER_MODE_STR_MAP.set (PLAYER_MODE_CREATIVE, "PLAYER_MODE_CREATIVE");
PLAYER_MODE_STR_MAP.set (PLAYER_MODE_SURVIVAL, "PLAYER_MODE_SURVIVAL");
let current_player_mode = PLAYER_MODE_CREATIVE;

const BLOCK_THROW_SPEED = 10;

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
const KEY_I = 'I'.charCodeAt (0);

let texture_atlas;

let texture_null;
let texture_dirt;
let texture_grass_side;
let texture_grass_top;
let texture_sand;
let texture_stone;
let texture_water;
let texture_log_side;
let texture_log_top;
let texture_leaves;

let is_game_paused = false;

let world;

// used to calculate average fps
let prev_fps = [];

// the main 3D graphics
let graphics;

let inventory_display;
let is_inventory_opened = false;
let picked_up_item = null;
let current_item_width = 50;
let current_hotbar_index = 0;

// Entities are non-block things in the world
// that need to be updated and drawn
// and can be added and removed
let g_entities = [];

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
    texture_log_side   = loadImage ("assets/texture_log_side.png");
    texture_log_top    = loadImage ("assets/texture_log_top.png");
    texture_leaves     = loadImage ("assets/texture_leaves.png");

}

//========================================================================

function setup ()
{
    // the main canvas handles any 2D elements like the HUD or Menus
    createCanvas (windowWidth, windowHeight);
    // graphics handles the 3d graphics of the game
    graphics = createGraphics (windowWidth, windowHeight, WEBGL);

    angleMode (RADIANS);

    // setup player
    player = new Player ();
    graphics.perspective (radians (FOV_DEGREES), width / height, 0.1, 8000);
    // move player to the first chunk
    player.set_position (BLOCK_WIDTH/2, -WORLD_HEIGHT*BLOCK_WIDTH, BLOCK_WIDTH/2);

    // Initialize the world
    world = new World ();

    // setup block textures and other static block info
    block_setup ();

    // start the game paused
    is_game_paused = true;

    inventory_display = new InventoryDisplay ();

    // disable right click browser menu popup
    for (let element of document.getElementsByClassName ("p5Canvas"))
        element.addEventListener ("contextmenu", (e) => e.preventDefault ());

    let item = new ItemEntity (new ItemStack (new Item (BLOCK_ID_LOG), 64));
    item.set_position (0.5, -40, 0.5);
    g_entities.push (item);

}

//========================================================================

function draw ()
{
    clear ();

    // Update game if game is not paused
    if (!is_game_paused)
    {
        graphics.clear ();
        // this resets certain values modified by transforms and lights
        // without this, the performance seems to significantly diminish over time
        // and causes lighting to be much more intense
        graphics.reset ();
        // give the 3D world a nice sky-colored background
        graphics.background (150, 200, 255);
        
        // setup light from Sun
        graphics.ambientLight (80, 80, 80);
        graphics.directionalLight (128, 128, 128, 0.5, -1, -0.5);

        process_key_input ();

        player.update ();
        
        // draw world
        world.draw_solid_blocks ();
        // draw outline for pointed at block
        if (current_pointed_at_block != null)
        {
            graphics.noFill ();
            graphics.strokeWeight (2);
            graphics.stroke (0);
            let [world_x, world_y, world_z] = convert_block_index_to_world_coords (current_pointed_at_block.x, current_pointed_at_block.y, current_pointed_at_block.z);
            graphics.translate (world_x + BLOCK_WIDTH/2, world_y-BLOCK_WIDTH/2, world_z+BLOCK_WIDTH/2);
            graphics.box (BLOCK_WIDTH);
            graphics.translate (-(world_x + BLOCK_WIDTH/2), -(world_y-BLOCK_WIDTH/2), -(world_z+BLOCK_WIDTH/2));
        }
        
        player.draw ();

        // draw all entities
        for (let e = 0; e < g_entities.length; ++e)
        {
            g_entities[e].update ();
            g_entities[e].draw ();
        }

        world.draw_transparent_blocks ();
    }

    // draw the 3D graphics as an image to the main canvas
    image (graphics, 0, 0, windowWidth, windowHeight);

    // draw overlay elements
    if (is_in_debug_mode) draw_debug_overlay ();
    draw_cursor ();
    draw_hotbar ();

    // draw inventory overlay
    // if user is in the inventory
    if (is_inventory_opened)
    {
        inventory_display.draw ();
        // draw held item
        if (picked_up_item != null)
        {
            picked_up_item.draw (mouseX, mouseY, current_item_width, current_item_width);
        }
    }

    // draw paused text, if paused
    if (is_game_paused)
    {
        push ();
        // darken background
        fill (0, 0, 0, 175);
        rect (0, 0, windowWidth, windowHeight);
        // draw paused message
        textSize (64);
        textFont (overlay_font);
        textAlign (CENTER);
        fill (255);
        text ("Paused", windowWidth / 2, windowHeight / 2 - 64);
        textSize (32);
        text ("Click anywhere to resume", windowWidth / 2, windowHeight / 2);
        pop ();
    }
}

//========================================================================

function draw_debug_overlay ()
{
    push ();
    // style
    textSize (24);
    textFont (overlay_font);
    // translate(-150, -150, 0);
    textAlign (LEFT, TOP);
    fill (255);
    stroke (0);
    strokeWeight (4);
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
    let vx = Math.floor (player.velocity.x * 100) / 100;
    let vy = Math.floor (player.velocity.y * 100) / 100;
    let vz = Math.floor (player.velocity.z * 100) / 100;
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
    let pointing_at_block = current_pointed_at_block == null ? "null" : `${current_pointed_at_block.x}, ${current_pointed_at_block.y}, ${current_pointed_at_block.z}`;
    let pointing_at_block_type = current_pointed_at_block == null ? "null" : BLOCK_ID_STR_MAP.get (world.get_block_type (current_pointed_at_block.x, current_pointed_at_block.y, current_pointed_at_block.z));
    // draw debug text
    text (`FPS: ${fps.toFixed (0)}, Ave: ${fps_ave.toFixed (0)}\n` +
        `frame time (ms): ${frame_time.toFixed (2)}, Ave: ${frame_time_ave.toFixed (2)}\n` +
        `tilt:       ${tilt.toFixed (2)} (RAD), ${degrees (tilt).toFixed (2)} (DEG)\n` +
        `pan:        ${pan.toFixed (2)} (RAD), ${degrees (pan).toFixed (2)} (DEG)\n` +
        `XYZ:        ${x}, ${y}, ${z}\n` +
        `velocity:   ${vx}, ${vy}, ${vz}\n` +
        `block:      ${block_x}, ${block_y}, ${block_z}\n` +
        `block_idx:  ${block_xi}, ${block_yi}, ${block_zi}\n` +
        `chunk_idx:  ${chunk_xi}, ${chunk_yi}, ${chunk_zi}\n` +
        `chunk_block_idx: ${chunk_block_xi}, ${chunk_block_yi}, ${chunk_block_zi}\n` +
        `block id:   ${block_type_str}\n` +
        `draw_style: ${DRAW_STYLE_STR_MAP.get (current_draw_style)}\n` +
        `pointing at block: ${pointing_at_block}\n` +
        `pointing at block type: ${pointing_at_block_type}\n` +
        `control mode: ${PLAYER_CONTROL_MODE_STR_MAP.get (player.control_mode)}\n` +
        `player mode:  ${PLAYER_MODE_STR_MAP.get (current_player_mode)}\n` +
        `num entities: ${g_entities.length}`,
        0, 0);
    pop ();
}

//========================================================================

function draw_cursor ()
{
    fill (255, 255, 255);
    stroke (0);
    strokeWeight (1);
    let w = 30;
    let h = 5;
    rect (width/2 - h/2, height/2 - w/2, h, w);
    rect (width/2 - w/2, height/2 - h/2, w, h);
}

//========================================================================

function draw_hotbar ()
{
    let cell_width = 50;
    let cell_padding = 10;
    let hotbar_width = cell_width + (cell_width + cell_padding) * 8 + 2 * cell_padding;
    let hotbar_height = cell_padding + cell_width + cell_padding;
    let hotbar_x = width / 2 - hotbar_width / 2;
    let hotbar_y = height - hotbar_height;
    fill ("#eee");
    noStroke ();
    rect (hotbar_x, hotbar_y, hotbar_width, hotbar_height);
    // highlight currently selected item
    let current_x = hotbar_x + current_hotbar_index * (cell_padding + cell_width);
    fill ("#5a5aff");
    noStroke ();
    rect (current_x, hotbar_y, cell_padding + cell_width + cell_padding, cell_padding + cell_width + cell_padding);
    // draw hotbar items
    player.hotbar.draw (hotbar_x + cell_padding, hotbar_y + cell_padding, cell_width, cell_padding);
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
    // mouse movement
    if (!is_inventory_opened)
    {
        player.tilt (movedY * MOUSE_SENSITIVITY);
        player.pan (movedX * MOUSE_SENSITIVITY);
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
    // move down
    if (keyIsDown (KEY_Z))
    {
        if (player.control_mode == PLAYER_CONTROL_MODE_FLYING || player.control_mode == PLAYER_CONTROL_MODE_NOCLIP)
            player.move_y (speed);
    }

    if (keyIsDown (KEY_SPACEBAR))
    {
        if (player.control_mode == PLAYER_CONTROL_MODE_NORMAL)
            player.jump ();
        else
            player.move_y (-speed);
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
    // toggle debug mode
    if (keyCode == KEY_G)
    {
        is_in_debug_mode = !is_in_debug_mode;
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
    // toggle inventory
    if (keyCode == KEY_I)
    {
        is_inventory_opened = !is_inventory_opened;
        // if we opened the inventory, then enable the mouse
        // so that the player can interact with the inventory
        exitPointerLock ();
    }
    // change (cycle through) player control mode
    if (keyCode == "P".charCodeAt (0))
    {
        player.control_mode = (player.control_mode + 1) % PLAYER_CONTROL_MODE_MAX;
    }
    // change (cycle through) player mode
    if (keyCode == "L".charCodeAt (0))
    {
        current_player_mode = (current_player_mode + 1) % PLAYER_MODE_MAX;
    }
    // cycle through hotbar
    if (keyCode == '1'.charCodeAt (0))
        current_hotbar_index = 0;
    else if (keyCode == '2'.charCodeAt (0))
        current_hotbar_index = 1;
    else if (keyCode == '3'.charCodeAt (0))
        current_hotbar_index = 2;
    else if (keyCode == '4'.charCodeAt (0))
        current_hotbar_index = 3;
    else if (keyCode == '5'.charCodeAt (0))
        current_hotbar_index = 4;
    else if (keyCode == '6'.charCodeAt (0))
        current_hotbar_index = 5;
    else if (keyCode == '7'.charCodeAt (0))
        current_hotbar_index = 6;
    else if (keyCode == '8'.charCodeAt (0))
        current_hotbar_index = 7;
    else if (keyCode == '9'.charCodeAt (0))
        current_hotbar_index = 8;
    
    // drop one item from hand
    if (keyCode == KEY_Q && !keyIsDown (SHIFT) && !is_inventory_opened)
    {
        // ensure there is an item to drop
        if (player.hotbar.slots[current_hotbar_index] != null)
        {
            // create the item that we want to drop
            let item_to_drop = new ItemStack (new Item (player.hotbar.slots[current_hotbar_index].get_item_type ()), 1);
            // decrement the item stack in the player's hand
            player.hotbar.slots[current_hotbar_index].amount--;
            // remove item stack if no more items
            if (player.hotbar.slots[current_hotbar_index].amount <= 0)
                player.hotbar.slots[current_hotbar_index] = null;
            // turn it into an Entity
            let item_to_drop_entity = new ItemEntity (item_to_drop);
            // give it some velocity in the direction that we are facing
            // specifically throw it from the camera
            item_to_drop_entity.set_position (player.camera.eyeX, player.camera.eyeY, player.camera.eyeZ);
            let camera_forward = createVector (cos (player.pan_amount), tan (player.tilt_amount), sin (player.pan_amount));
            camera_forward.normalize ();
            item_to_drop_entity.add_velocity (camera_forward.x*BLOCK_THROW_SPEED, camera_forward.y*BLOCK_THROW_SPEED, camera_forward.z*BLOCK_THROW_SPEED);
            // add entity to list so it will be updated and drawn
            g_entities.push (item_to_drop_entity);
        }
    }
    // drop whole stack from hand
    if (keyCode == KEY_Q && keyIsDown (SHIFT) && !is_inventory_opened)
    {
        // ensure there is an item to drop
        if (player.hotbar.slots[current_hotbar_index] != null)
        {
            // get stack to drop
            let item_stack_to_drop = player.hotbar.slots[current_hotbar_index];
            // remove stack
            player.hotbar.slots[current_hotbar_index] = null;
            // turn it into an Entity
            let item_stack_to_drop_entity = new ItemEntity (item_stack_to_drop);
            // give it some velocity in the direction that we are facing
            // specifically throw it from the camera
            item_stack_to_drop_entity.set_position (player.camera.eyeX, player.camera.eyeY, player.camera.eyeZ);
            let camera_forward = createVector (cos (player.pan_amount), tan (player.tilt_amount), sin (player.pan_amount));
            camera_forward.normalize ();
            let throw_speed = 10;
            item_stack_to_drop_entity.add_velocity (camera_forward.x*BLOCK_THROW_SPEED, camera_forward.y*BLOCK_THROW_SPEED, camera_forward.z*BLOCK_THROW_SPEED);
            // add entity to list so it will be updated and drawn
            g_entities.push (item_stack_to_drop_entity);
        }
    }

}

//========================================================================

function mousePressed ()
{
    // process mouse presses on the inventory display
    if (is_inventory_opened)
    {
        let was_pressed = inventory_display.pressed ();
        if (!was_pressed)
        {
            // we clicked on the screen but not on the inventory
            // so close the inventory
            is_inventory_opened = false;
            // and relock the mouse so the player can control the camera
            // we need to first exit pointer lock in-case the cursor
            // somehow got out of the lock
            exitPointerLock ();
            // resume the game (if it wasnt already running)
            is_game_paused = false;
            requestPointerLock ();
            return;
        }
    }
    if (!is_inventory_opened && !is_game_paused)
    {
        // mine/delete blocks or attack
        if (mouseButton === LEFT)
        {
            if (current_pointed_at_block != null)
            {
                let block_type = world.get_block_type (current_pointed_at_block.x, current_pointed_at_block.y, current_pointed_at_block.z);
                // delete the block
                world.delete_block_at (current_pointed_at_block.x, current_pointed_at_block.y, current_pointed_at_block.z);
                // drop item entity from the block
                let block_item_entity = new ItemEntity (new ItemStack (new Item (block_type), 1));
                // move entity to block's position
                block_item_entity.set_position (current_pointed_at_block.x * BLOCK_WIDTH, -current_pointed_at_block.y * BLOCK_WIDTH - BLOCK_WIDTH/2, current_pointed_at_block.z * BLOCK_WIDTH);
                // send block in a random direction
                let dir = p5.Vector.random3D ();
                let vel = p5.Vector.mult (dir, BLOCK_THROW_SPEED/2);
                block_item_entity.add_velocity (vel.x, vel.y, vel.z);
                // Broken blocks should be able to be picked up instantly
                // so clear delay
                block_item_entity.collect_delay = 0.0;
                // add entity to global list
                g_entities.push (block_item_entity);
            }
        }
        // place block or use item
        else if (mouseButton === RIGHT)
        {
            if (current_pointed_at_block != null)
            {
                // place the block from the player's inventory (if there is one)
                if (player.hotbar.slots[current_hotbar_index] != null)
                {
                    let block_id_to_place = player.hotbar.slots[current_hotbar_index].item.item_id;
                    // dont place anything if nothing in hand
                    if (block_id_to_place != null)
                    {
                        world.set_block_at (block_id_to_place, pointed_at_block_neighbor.x, pointed_at_block_neighbor.y, pointed_at_block_neighbor.z);
                        // decrement blocks (if not in creative mode)
                        if (current_player_mode != PLAYER_MODE_CREATIVE)
                        {
                            // decrement item stack
                            player.hotbar.slots[current_hotbar_index].amount--;
                            // remove item stack if no more items
                            if (player.hotbar.slots[current_hotbar_index].amount <= 0)
                                player.hotbar.slots[current_hotbar_index] = null;
                        }
                    }
                }
            }
        }
    }
    // ensure that player isnt in their inventory
    // unless the game is paused
    if (!is_inventory_opened || is_game_paused)
    {
        // we need to first exit pointer lock in-case the cursor
        // somehow got out of the lock
        exitPointerLock ();
        // resume the game (if it wasnt already running)
        is_game_paused = false;
        is_inventory_opened = false;
        requestPointerLock ();
    }
}

//========================================================================

function mouseReleased ()
{
    // process mouse releases on the inventory display
    if (is_inventory_opened)
    {
        inventory_display.released ();
    }
}

//========================================================================

function mouseWheel (event)
{
    // scroll up
    if (event.delta > 0)
    {
        for (let i = 0; i < Math.abs (event.delta); ++i)
        {
            current_hotbar_index++;
            // ensure we wrap back to 0
            if (current_hotbar_index > 8)
                current_hotbar_index = 0;
        }
    }
    // scroll down
    else if (event.delta < 0)
    {
        for (let i = 0; i < Math.abs (event.delta); ++i)
        {
            current_hotbar_index--;
            // ensure we wrap back to 8
            if (current_hotbar_index < 0)
                current_hotbar_index = 8;
        }
    }
}

//========================================================================

function windowResized ()
{
    resizeCanvas (windowWidth, windowHeight);
    graphics.resizeCanvas (windowWidth, windowHeight);
    // reset camera perspective
    graphics.perspective (radians (FOV_DEGREES), width / height, 0.1, 8000);
}

//========================================================================

