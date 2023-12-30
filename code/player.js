// Minecraft in P5.js
// Player code
// Author: Amy Burnett
//========================================================================
// Globals

const GRAVITY_ACCELERATION = 1;
const TERMINAL_VELOCITY = 20;
const JUMP_FORCE = 5;

const FOV_DEGREES = 90;
const CAMERA_LOOK_SPEED = 0.002;
const CAMERA_RUN_LOOK_SPEED = CAMERA_LOOK_SPEED*2;
const CAMERA_MOVEMENT_SPEED = 0.05;
const CAMERA_RUN_MOVEMENT_SPEED = CAMERA_MOVEMENT_SPEED*4;

//========================================================================

class Player
{
    constructor ()
    {
        // position is the bottom middle of the player
        this.position = createVector (0, 0, 0);
        this.velocity = createVector (0, 0, 0);

        // we need to keep track of this player's local axes
        // for knowing which way is right relative to the player
        // (rather than relative to the world) 
        this.up      = createVector (0, 1, 0);
        this.right   = createVector (1, 0, 0);
        this.forward = createVector (0, 0, 1);

        this.pan_amount = 0;
        this.tilt_amount = 0;

        this.jump_force = JUMP_FORCE;
    
        // the rate at which the player's velocity dampens
        this.friction_factor = 0.75;

        this.is_falling = false;

        this.camera = createCamera ();

        this.width = BLOCK_WIDTH * 0.75;
        this.height = BLOCK_WIDTH * 1.75;
        
    }

    set_position (x, y, z)
    {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    // applies a left/right (X axis) speed to the player
    move_x (speed)
    {
        this.velocity.add (p5.Vector.mult (this.right, speed));
    }

    // applies an up/down (Y axis) speed to the player
    // *this is mostly for flying
    // use jump() for jumping
    move_y (speed)
    {
        this.velocity.add (p5.Vector.mult (this.up, speed));
    }

    // applies a forward/backward (Z axis) speed to the player
    move_z (speed)
    {
        this.velocity.add (p5.Vector.mult (this.forward, speed));
    }

    // rotates the player around the Y axis by the given angle
    // aka looking left/right
    pan (angle)
    {
        this.pan_amount += angle;
        // wrap angle if we exceed 360 degrees
        this.pan_amount = this.pan_amount % radians (360);
    }

    // rotates the player's head by it's local x axis
    // aka looking up/down
    tilt (angle)
    {
        this.tilt_amount += angle;
        // ensure tilt doesnt exceed bounds
        // 2.01 ensures we do not look fully up or down
        // bc it gets glitchy at 90 degrees
        if (this.tilt_amount > PI/2) this.tilt_amount = PI/2.01;
        if (this.tilt_amount < -PI/2) this.tilt_amount = -PI/2.01;
    }

    jump ()
    {
        // ensure we are on the ground to be able to jump
        if (this.is_falling)
            return;
        this.velocity.add (0, -this.jump_force, 0);
        this.is_falling = true;
    }

    update ()
    {

        // apply pan to local axis
        // ignore tilt for now bc we want to be able to move straight forward
        this.forward = createVector (cos (this.pan_amount), 0, sin (this.pan_amount));
        this.forward.normalize ();
        this.right = createVector (cos (this.pan_amount - PI/2), 0, sin (this.pan_amount - PI/2));

        // determine if player is on the ground or is falling
        // this is done by checking the block below the player
        // convert player position to block coords
        // let [chunk_x, chunk_z] = get_containing_chunk (this.position.x, this.position.z);
        // let [block_x, block_y, block_z] = convert_world_to_block (this.position.x, this.position.y, this.position.z);
        // this.is_falling = true;
        // // ensure chunk is loaded
        // if (chunk_map.has (`${chunk_x},${chunk_z}`))
        // {
        //     // ensure player is within y range
        //     if (block_y < WORLD_HEIGHT && block_y >= 0)
        //     {
        //         let chunk = chunk_map.get (`${chunk_x},${chunk_z}`);
        //         // convert world block to chunk block
        //         let chunk_block_xi = block_x % CHUNK_SIZE;
        //         let chunk_block_yi = block_y;
        //         let chunk_block_zi = block_z % CHUNK_SIZE;
        //         let block = chunk.blocks[chunk_block_xi][chunk_block_yi][chunk_block_zi];
        //         // ensure block is solid
        //         if (block != BLOCK_ID_AIR && block != BLOCK_ID_WATER)
        //         {
        //             // block is solid, no need to check for collisions,
        //             // we already know we are on this block
        //             this.is_falling = false;
        //             // ensure we are on top of the block
        //             this.position.y = -(block_y * BLOCK_WIDTH) - BLOCK_WIDTH;
        //             // stop movement in y direction
        //             // this.velocity.y = 0;
        //         }
        //     }
        // }

        // if we were previously falling but are no longer falling,
        // then we hit the ground
        // if we had a lot of velocity, then take fall damage

        // apply gravity force if we are falling
        if (this.is_falling)
        {
            // update velocity by gravity
            let acceleration_gravity = createVector (0, GRAVITY_ACCELERATION, 0);
            // this.velocity.add (acceleration_gravity);
            // ensure we do not exceed terminal velocity from falling
            if (Math.abs (this.velocity.y) > TERMINAL_VELOCITY)
                // match terminal velocity (and retain original signed direction)
                this.velocity.y = Math.sign (this.velocity.y) == -1 ? -TERMINAL_VELOCITY : TERMINAL_VELOCITY;
    
        }

        // apply friction dampener in X/Z directions
        // this.velocity.mult (createVector (this.friction_factor, 1, this.friction_factor));
        // **TEMP** this is for flying behaviour
        this.velocity.mult (createVector (this.friction_factor, this.friction_factor, this.friction_factor));

        // save previous position - for checking collisions between prev and next position
        let prev_position = createVector (this.position.x, this.position.y, this.position.z);
        // apply velocity
        this.position.add (this.velocity);

        // Collisions detection
        // The sample rate of the draw loop is not frequent enough
        // to accurately check when all collisions occur.
        // Fast velocities can pass multiple blocks between frames.
        // Because of this, we need to check for collisions that might
        // have happened between the last frame and this new one
        // ensure that the new position does not pass through a block.
        // check X direction

        // check Y direction
        // this handles checking for falling and hitting the ground

        // check Z direction

        // sync global camera position with player
        // camera's forward takes into account tilt
        let camera_forward = createVector (cos (this.pan_amount), tan (this.tilt_amount), sin (this.pan_amount));
        camera_forward.normalize ();
        // focused_point is a point where the camera will look at which the camera needs
        let focused_point = p5.Vector.add (this.position, camera_forward);
        camera (this.position.x, this.position.y-this.height, this.position.z, focused_point.x, focused_point.y-this.height, focused_point.z, this.up.x, this.up.y, this.up.z);
        
    }

    // **assumes that player wasn't already colliding with a block
    // clamp_collisions_y (prev_position, next_position)
    // {
    //     // Case A: hasnt moved up or down
    //     if (prev_position.y == next_position.y)
    //         // we havent moved so no need to check collisions
    //         return;

    //     // Case B: traveling up
    //     // y axis decreases in value as you go up (gets more negative)
    //     else if (prev_position.y < next_position.y)
    //     {
    //         // Case 1: prev is above WORLD_HEIGHT
    //         if (prev_position.y < WORLD_HEIGHT*BLOCK_WIDTH)
    //             // we are above the world and traveling further up
    //             // so we shouldnt run into any obstacles
    //             // ascend away!
    //             return;
                
    //         // Case 2: prev is below WORLD_HEIGHT
    //         if (prev_position.y > WORLD_HEIGHT*BLOCK_WIDTH)
    //         {
    //             // we are below the world and flying up
    //             // so we need to make sure we don't bump 
    //             // into the bottom of the map or anything higher up.
    //             let [block_xi, block_yi, block_zi] = convert_world_to_block (prev_position.x, 0, prev_position.z);
    //             while (block_yi < WORLD_HEIGHT)
    //             {
    //                 let block_y_bottom = block_yi * BLOCK_WIDTH;
    //                 let block_type = get_block (block_xi, block_yi, block_zi);
    //                 let is_solid = block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER;
    //                 // we need to make sure the top of the player is below
    //                 let next_position_y_top = next_position.y - this.height; // up is negative
    //                 let is_next_position_past_block = next_position_y_top <= block_y_bottom;
    //                 if (is_solid && is_next_position_past_block)
    //                 {
    //                     // player should have collided with this block
    //                     // reset position to this block
    //                     return createVector (next_position.x, block_y_bottom+this.height, next_position.z);
    //                 }
    //                 // repeat
    //                 --block_yi;
    //             }
    //         }

    //         // Case 3: prev is within WORLD_HEIGHT



    //     }

    //     // Case C: traveling down
    //     else if (prev_position.y > next_position.y)
    //     {

    //     }
    // }

    // draws the player's model
    draw ()
    {
        
    }
}