// Minecraft in P5.js
// Player code
// Author: Amy Burnett
//========================================================================
// Globals

// Normal - gravity, jumping, collides with blocks
const PLAYER_CONTROL_MODE_NORMAL = 0;
// Flying - no gravity, flying, collides with blocks
const PLAYER_CONTROL_MODE_FLYING = 1;
// No-Clip - no gravity, flying, no collisions
const PLAYER_CONTROL_MODE_NOCLIP = 2;
const PLAYER_CONTROL_MODE_MAX    = 3;
const PLAYER_CONTROL_MODE_STR_MAP = new Map ();
PLAYER_CONTROL_MODE_STR_MAP.set (PLAYER_CONTROL_MODE_NORMAL, "PLAYER_CONTROL_MODE_NORMAL");
PLAYER_CONTROL_MODE_STR_MAP.set (PLAYER_CONTROL_MODE_FLYING, "PLAYER_CONTROL_MODE_FLYING");
PLAYER_CONTROL_MODE_STR_MAP.set (PLAYER_CONTROL_MODE_NOCLIP, "PLAYER_CONTROL_MODE_NOCLIP");

const GRAVITY_ACCELERATION = 20;
const TERMINAL_VELOCITY = 50;
const JUMP_FORCE = 8;

const FOV_DEGREES = 90;
const CAMERA_LOOK_SPEED = 0.002;
const CAMERA_RUN_LOOK_SPEED = CAMERA_LOOK_SPEED*2;
const CAMERA_MOVEMENT_SPEED = 0.1;
const CAMERA_RUN_MOVEMENT_SPEED = CAMERA_MOVEMENT_SPEED*4;
const MOUSE_SENSITIVITY = 0.01;

const COLLISION_DETECT_FREQUENCY = 0.05;

//========================================================================

class Player
{
    constructor ()
    {
        // player position is from bottom middle position
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

        this.is_falling = true;

        this.camera = graphics.createCamera ();

        this.width = BLOCK_WIDTH * 0.75;
        this.height = BLOCK_WIDTH * 1.75;

        // player's currently equipped equipment
        // helmet, chest, pants, boots, backpack?
        this.equipment = new Inventory (4, 1);
        // player's main inventory
        this.inventory = new Inventory (3, 9);
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_GRASS), 64));
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_DIRT), 64));
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_STONE), 64));
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_WATER), 64));
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_SAND), 64));
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_LOG), 64));
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_LEAVES), 64));
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_GLASS), 64));
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_WOODEN_PLANKS), 64));
        this.inventory.add_item (new ItemStack (new Item (BLOCK_ID_COBBLESTONE), 64));
        this.inventory.add_item (new ItemStack (new Item (ITEM_ID_STICK), 16));
        // player's hotbar
        this.hotbar = new Inventory (1, 9);
        this.hotbar.add_item (new ItemStack (new Item (ITEM_ID_STONE_PICKAXE), 1));
        this.hotbar.add_item (new ItemStack (new Item (ITEM_ID_STONE_SHOVEL), 1));
        this.hotbar.add_item (new ItemStack (new Item (ITEM_ID_STONE_AXE), 1));
        this.hotbar.add_item (new ItemStack (new Item (ITEM_ID_STONE_HOE), 1));
        this.hotbar.add_item (new ItemStack (new Item (ITEM_ID_STONE_SWORD), 1));
        this.hotbar.add_item (new ItemStack (new Item (BLOCK_ID_LOG), 64));
        this.hotbar.add_item (new ItemStack (new Item (BLOCK_ID_LEAVES), 64));
        this.hotbar.add_item (new ItemStack (new Item (BLOCK_ID_GLASS), 64));
        this.hotbar.add_item (new ItemStack (new Item (BLOCK_ID_DIRT), 64));
        this.hotbar.add_item (new ItemStack (new Item (BLOCK_ID_STONE), 64));
        this.hotbar.add_item (new ItemStack (new Item (BLOCK_ID_SAND), 64));
        
        this.control_mode = PLAYER_CONTROL_MODE_NORMAL;
    }

    set_position (x, y, z)
    {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    get_AABB ()
    {
        return [
            this.position.x - this.width/2,
            this.position.x + this.width/2,
            this.position.y,
            this.position.y - this.height,
            this.position.z - this.width/2,
            this.position.z + this.width/2
        ];
    }

    get_AABB_from_pos (pos)
    {
        return [
            pos.x - this.width/2,
            pos.x + this.width/2,
            pos.y,
            pos.y - this.height,
            pos.z - this.width/2,
            pos.z + this.width/2
        ];
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
        this.pan_amount = this.pan_amount % TWO_PI;
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

    get_camera_forward ()
    {
        return createVector (cos (this.pan_amount), tan (this.tilt_amount), sin (this.pan_amount));
    }

    get_camera_position ()
    {
        return createVector (this.camera.eyeX, this.camera.eyeY, this.camera.eyeZ);
    }

    // returns true if the given position is outside the player's FOV
    // true otherwise
    is_outside_camera_view (v)
    {
        // this works by checking the angle between the direction the camera is facing
        // and a vector pointing from the camera to the given position
        let cam_to_v = p5.Vector.sub (v, this.get_camera_position ());
        let angle_between = p5.Vector.angleBetween (this.get_camera_forward (), cam_to_v);
        let is_v_behind_camera = Math.abs (angle_between) > radians (FOV_DEGREES);
        return is_v_behind_camera;
    }

    update ()
    {

        // apply pan to local axis
        // ignore tilt for now bc we want to be able to move straight forward
        this.forward = createVector (cos (this.pan_amount), 0, sin (this.pan_amount));
        this.forward.normalize ();
        this.right = createVector (cos (this.pan_amount - PI/2), 0, sin (this.pan_amount - PI/2));

        // apply gravity force if we are falling
        if (this.is_falling && this.control_mode == PLAYER_CONTROL_MODE_NORMAL)
        {
            // update velocity by gravity
            // *deltaTime gives us the amount of gravity to apply since the last frame
            // deltaTime is in milliseconds so we divide by 1000 for seconds
            let acceleration_gravity = createVector (0, GRAVITY_ACCELERATION*(deltaTime/1000), 0);
            this.velocity.add (acceleration_gravity);
            // ensure we do not exceed terminal velocity from falling
            if (Math.abs (this.velocity.y) > TERMINAL_VELOCITY)
                // match terminal velocity (and retain original signed direction)
                this.velocity.y = Math.sign (this.velocity.y) == -1 ? -TERMINAL_VELOCITY : TERMINAL_VELOCITY;
        }

        // apply friction dampener in X/Z directions
        if (this.control_mode == PLAYER_CONTROL_MODE_NORMAL)
            // ignore y direction - will be handled by gravity + terminal velocity clamp
            this.velocity.mult (createVector (this.friction_factor, 1, this.friction_factor));
        else if (this.control_mode == PLAYER_CONTROL_MODE_FLYING || this.control_mode == PLAYER_CONTROL_MODE_NOCLIP)
            // Flying behavior should dampen y as well
            this.velocity.mult (createVector (this.friction_factor, this.friction_factor, this.friction_factor));

        // save previous position - for checking collisions between prev and next position
        let prev_position = createVector (this.position.x, this.position.y, this.position.z);
        // apply velocity
        // scaled by delta time to make movement independent of frameRate
        this.position.add (p5.Vector.mult (this.velocity, deltaTime/1000));

        // Collisions detection + correction
        if (this.control_mode != PLAYER_CONTROL_MODE_NOCLIP)
        {
            // check left direction (if we moved left)
            if (prev_position.x > this.position.x)
            {
                // check left
                // check multiple points along path
                // bc the player could have traveled far between frames
                for (let x = prev_position.x; x >= this.position.x; x -= COLLISION_DETECT_FREQUENCY)
                {
                    // if we are close enough to the end position,
                    // then just check the exact position
                    if (x - this.position.x <= COLLISION_DETECT_FREQUENCY)
                    {
                        x = this.position.x;
                    }
                    let [block_xi, block_yi, block_zi] = convert_world_to_block_index (x-this.width/2, this.position.y-BLOCK_WIDTH/2, this.position.z);
                    let block_type = world.get_block_type (block_xi, block_yi, block_zi);
                    if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
                    {
                        let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB_from_pos (createVector (x, this.position.y, this.position.z));
                        let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                        let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                        if (is_colliding)
                        {
                            // console.log ("Colliding left!");
                            // correct collision
                            this.position.x = bxmax+this.width/2;
                            // ensure we aren't still moving in this direction
                            this.velocity.x = 0;
                            // found a collision in this direction, we can stop looking
                            break;
                        }
                    }
                }
            }
            // check right direction (if we moved right)
            if (prev_position.x < this.position.x)
            {
                // check right
                for (let x = prev_position.x; x <= this.position.x; x += COLLISION_DETECT_FREQUENCY)
                {
                    // if we are close enough to the end position,
                    // then just check the exact position
                    if (this.position.x - x <= COLLISION_DETECT_FREQUENCY)
                    {
                        x = this.position.x;
                    }
                    let [block_xi, block_yi, block_zi] = convert_world_to_block_index (x+this.width/2, this.position.y-BLOCK_WIDTH/2, this.position.z);
                    let block_type = world.get_block_type (block_xi, block_yi, block_zi);
                    if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
                    {
                        let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB_from_pos (createVector (x, this.position.y, this.position.z));
                        let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                        let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                        if (is_colliding)
                        {
                            // console.log ("Colliding right!");
                            // correct collision
                            this.position.x = bxmin-this.width/2;
                            // ensure we aren't still moving in this direction
                            this.velocity.x = 0;
                            // found a collision in this direction, we can stop looking
                            break;
                        }
                    }
                }
            }
    
            // check down direction (if we moved down)
            // y increases going down
            this.is_falling = true;
            if (prev_position.y < this.position.y)
            {
                // check down
                // check multiple points along path
                // bc the player could have traveled far between frames
                for (let y = prev_position.y; y <= this.position.y; y += COLLISION_DETECT_FREQUENCY)
                {
                    // if we are close enough to the end position,
                    // then just check the exact position
                    if (this.position.y - y <= COLLISION_DETECT_FREQUENCY)
                    {
                        y = this.position.y;
                    }
                    // determine block type at this position
                    let [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x, y, this.position.z);
                    let block_type = world.get_block_type (block_xi, block_yi, block_zi);
                    if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
                    {
                        let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB_from_pos (createVector (this.position.x, y, this.position.z));
                        let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                        let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                        if (is_colliding)
                        {
                            // console.log ("Colliding down!");
                            // correct collision
                            this.position.y = bymax;
                            // ensure we aren't still moving in this direction
                            this.velocity.y = 0;
                            // since we collided with the ground, we are no longer falling
                            this.is_falling = false;
                            // found a collision in this direction, we can stop looking
                            break;
                        }
                    }
                }
            }
            // check up (if we moved up)
            // y decreases going up
            if (prev_position.y > this.position.y)
            {
                // check up
                // check multiple points along path
                // bc the player could have traveled far between frames
                for (let y = prev_position.y; y >= this.position.y; y -= COLLISION_DETECT_FREQUENCY)
                {
                    // if we are close enough to the end position,
                    // then just check the exact position
                    if (y - this.position.y <= COLLISION_DETECT_FREQUENCY)
                    {
                        y = this.position.y;
                    }
                    let [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x, y-this.height, this.position.z);
                    let block_type = world.get_block_type (block_xi, block_yi, block_zi);
                    if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
                    {
                        let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB_from_pos (createVector (this.position.x, y, this.position.z));
                        let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                        let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                        if (is_colliding)
                        {
                            // console.log ("Colliding up!");
                            // correct collision
                            this.position.y = bymin+this.height+0.1; // add 0.1 extra padding due to camera
                            // ensure we aren't still moving in this direction
                            this.velocity.y = 0;
                            // found a collision in this direction, we can stop looking
                            break;
                        }
                    }
                }
            }
            // check forward (if we moved forward)
            if (prev_position.z < this.position.z)
            {
                // check forward
                // check multiple points along path
                // bc the player could have traveled far between frames
                for (let z = prev_position.z; z <= this.position.z; z += COLLISION_DETECT_FREQUENCY)
                {
                    // if we are close enough to the end position,
                    // then just check the exact position
                    if (this.position.z - z <= COLLISION_DETECT_FREQUENCY)
                    {
                        z = this.position.z;
                    }
                    let [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x, this.position.y-BLOCK_WIDTH/2, z+this.width/2);
                    let block_type = world.get_block_type (block_xi, block_yi, block_zi);
                    if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
                    {
                        let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB_from_pos (createVector (this.position.x, this.position.y, z));
                        let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                        let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                        if (is_colliding)
                        {
                            // console.log ("Colliding forward!");
                            // correct collision
                            this.position.z = bzmin-this.width/2;
                            // ensure we aren't still moving in this direction
                            this.velocity.z = 0;
                            // found a collision in this direction, we can stop looking
                            break;
                        }
                    }
                }
            }
            // check back (if we moved back)
            if (prev_position.z > this.position.z)
            {
                // check back
                // check multiple points along path
                // bc the player could have traveled far between frames
                for (let z = prev_position.z; z >= this.position.z; z -= COLLISION_DETECT_FREQUENCY)
                {
                    // if we are close enough to the end position,
                    // then just check the exact position
                    if (z - this.position.z <= COLLISION_DETECT_FREQUENCY)
                    {
                        z = this.position.z;
                    }
                    let [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x, this.position.y-BLOCK_WIDTH/2, z-this.width/2);
                    let block_type = world.get_block_type (block_xi, block_yi, block_zi);
                    if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
                    {
                        let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB_from_pos (createVector (this.position.x, this.position.y, z));
                        let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                        let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                        if (is_colliding)
                        {
                            // console.log ("Colliding back!");
                            // correct collision
                            this.position.z = bzmax+this.width/2;
                            // ensure we aren't still moving in this direction
                            this.velocity.z = 0;
                            // found a collision in this direction, we can stop looking
                            break;
                        }
                    }
                }
            } 
        }

        // sync global camera position with player
        // camera's forward takes into account tilt
        let camera_forward = this.get_camera_forward ();
        camera_forward.normalize ();
        // focused_point is a point where the camera will look at which the camera needs
        let focused_point = p5.Vector.add (this.position, camera_forward);
        graphics.camera (this.position.x, this.position.y-this.height, this.position.z, focused_point.x, focused_point.y-this.height, focused_point.z, this.up.x, this.up.y, this.up.z);
        
        // raycasting V1
        // determine what block the player is pointing at (if any)
        this.ray_casting_v1 (camera_forward, createVector (this.camera.eyeX, this.camera.eyeY, this.camera.eyeZ));

        // collect items
        for (let e = g_entities.length-1; e >= 0; --e)
        {
            let entity = g_entities[e];
            // we only want to collect items
            // and ignore if item has a collect delay
            if (entity instanceof ItemEntity && entity.collect_delay <= 0.0)
            {
                // check if we are colliding with the entity
                let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB ();
                let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = entity.get_AABB ();
                let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                if (is_colliding)
                {
                    // collect the item - if we have space
                    // inventory will spit back the item stack if there is not enough space
                    // first try to add to hotbar
                    let remaining_item_stack = this.hotbar.add_item (entity.item_stack);
                    // next try to add to inventory
                    if (remaining_item_stack != null)
                        remaining_item_stack = this.inventory.add_item (remaining_item_stack);
                    // spit back out remaining items if we still have some
                    if (remaining_item_stack != null)
                    {
                        entity.item_stack = remaining_item_stack;
                    }
                    // otherwise, we picked up the whole item stack so remove the entity
                    else
                    {
                        g_entities.splice (e, 1);
                    }
                }
            }
        }
    }

    // sends out a ray and samples multiple points along that line
    // this is not perfect. corners/edges could be inbetween points and get missed
    ray_casting_v1 (camera_forward, camera_position)
    {
        // start with a ray pointing from the camera 
        // to the direction that the camera is facing.
        let ray = camera_forward;
        // we need to scale the ray to the player's interaction range
        // aka, the player can interact with blocks up to 5 blocks away (in radius)
        let range = 5 * BLOCK_WIDTH;
        ray = p5.Vector.setMag (ray, range);
        // assume that we aren't looking at a block
        // and update it afterwards
        current_pointed_at_block = null;
        // check multiple points along the ray for collisions with blocks
        // **this is not perfect because a block's corner/edge may
        // intersect with the ray inbetween points
        // however, it seems like we can turn this up to 100 samples
        // without any noticeable drop to performance (steady 60 fps with one chunk)
        let num_points = 100;
        let p_prev = createVector (0, 0, 0);
        for (let i = 1; i <= num_points; ++i)
        {
            let p = p5.Vector.add (camera_position, p5.Vector.mult (ray, i / num_points));
            // check if point is inside a block
            let [block_x, block_y, block_z] = convert_world_to_block_index (p.x, p.y, p.z);
            let block_type = world.get_block_type (block_x, block_y, block_z);
            // ignore if no block, or airblock, or water
            if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
            {
                // point is inside a block
                // save the block as a vector
                current_pointed_at_block = createVector (block_x, block_y, block_z);
                // draw the intersection point as a sphere (for debugging)
                if (is_in_debug_mode)
                {
                    graphics.fill (255);
                    graphics.noStroke ();
                    graphics.translate (p.x, p.y, p.z);
                    graphics.sphere (0.05);
                    graphics.translate (-p.x, -p.y, -p.z);
                }
                // determine which face of the block's hitbox was intersected
                // front
                let [world_x, world_y, world_z] = convert_block_index_to_world_coords (block_x, block_y, block_z);
                let x0 = world_x;
                let x1 = world_x + BLOCK_WIDTH;
                let y0 = world_y - BLOCK_WIDTH; // up is -y
                let y1 = world_y;
                let z0 = world_z + BLOCK_WIDTH;
                let z1 = world_z + BLOCK_WIDTH;
                let are_left_of_face = p_prev.x < x0 && p.x < x0;
                let are_right_of_face = p_prev.x > x1 && p.x > x1;
                let are_infront_of_face = p_prev.z > z0 && p.z > z0;
                let are_behind_face = p_prev.z < z1 && p.z < z1;
                let are_above_face = p_prev.y < y0 && p.y < y0;
                let are_below_face = p_prev.y > y1 && p.y > y1;
                if (!are_left_of_face && !are_right_of_face && !are_infront_of_face && !are_behind_face && !are_above_face && !are_below_face)
                {
                    // intersects!
                    // console.log ("intersects front face!");
                    // save neighbor block so we know where to place a new block
                    pointed_at_block_neighbor = createVector (block_x, block_y, block_z+1);
                    // found a point - so stop looking
                    break;
                }
                // back
                x0 = world_x;
                x1 = world_x + BLOCK_WIDTH;
                y0 = world_y - BLOCK_WIDTH; // up is -y
                y1 = world_y;
                z0 = world_z;
                z1 = world_z;
                are_left_of_face = p_prev.x < x0 && p.x < x0;
                are_right_of_face = p_prev.x > x1 && p.x > x1;
                are_infront_of_face = p_prev.z < z0 && p.z < z0;
                are_behind_face = p_prev.z > z0 && p.z > z0;
                are_above_face = p_prev.y < y0 && p.y < y0;
                are_below_face = p_prev.y > y1 && p.y > y1;
                if (!are_left_of_face && !are_right_of_face && !are_infront_of_face && !are_behind_face && !are_above_face && !are_below_face)
                {
                    // intersects!
                    // console.log ("intersects behind face!");
                    // save neighbor block so we know where to place a new block
                    pointed_at_block_neighbor = createVector (block_x, block_y, block_z-1);
                    // found a point - so stop looking
                    break;
                }
                // left
                x0 = world_x;
                x1 = world_x;
                y0 = world_y - BLOCK_WIDTH; // up is -y
                y1 = world_y;
                z0 = world_z;
                z1 = world_z + BLOCK_WIDTH;
                are_left_of_face = p_prev.x < x0 && p.x < x0;
                are_right_of_face = p_prev.x > x1 && p.x > x1;
                are_infront_of_face = p_prev.z > z1 && p.z > z1;
                are_behind_face = p_prev.z < z0 && p.z < z0;
                are_above_face = p_prev.y < y0 && p.y < y0;
                are_below_face = p_prev.y > y1 && p.y > y1;
                if (!are_left_of_face && !are_right_of_face && !are_infront_of_face && !are_behind_face && !are_above_face && !are_below_face)
                {
                    // intersects!
                    // console.log ("intersects left face!");
                    // save neighbor block so we know where to place a new block
                    pointed_at_block_neighbor = createVector (block_x-1, block_y, block_z);
                    // found a point - so stop looking
                    break;
                }
                // right
                x0 = world_x + BLOCK_WIDTH;
                x1 = world_x + BLOCK_WIDTH;
                y0 = world_y - BLOCK_WIDTH; // up is -y
                y1 = world_y;
                z0 = world_z;
                z1 = world_z + BLOCK_WIDTH;
                are_left_of_face = p_prev.x < x0 && p.x < x0;
                are_right_of_face = p_prev.x > x1 && p.x > x1;
                are_infront_of_face = p_prev.z > z1 && p.z > z1;
                are_behind_face = p_prev.z < z0 && p.z < z0;
                are_above_face = p_prev.y < y0 && p.y < y0;
                are_below_face = p_prev.y > y1 && p.y > y1;
                if (!are_left_of_face && !are_right_of_face && !are_infront_of_face && !are_behind_face && !are_above_face && !are_below_face)
                {
                    // intersects!
                    // console.log ("intersects right face!");
                    // save neighbor block so we know where to place a new block
                    pointed_at_block_neighbor = createVector (block_x+1, block_y, block_z);
                    // found a point - so stop looking
                    break;
                }
                // top
                x0 = world_x;
                x1 = world_x + BLOCK_WIDTH;
                y0 = world_y - BLOCK_WIDTH; // up is -y
                y1 = world_y - BLOCK_WIDTH;
                z0 = world_z;
                z1 = world_z + BLOCK_WIDTH;
                are_left_of_face = p_prev.x < x0 && p.x < x0;
                are_right_of_face = p_prev.x > x1 && p.x > x1;
                are_infront_of_face = p_prev.z > z1 && p.z > z1;
                are_behind_face = p_prev.z < z0 && p.z < z0;
                are_above_face = p_prev.y < y0 && p.y < y0;
                are_below_face = p_prev.y > y1 && p.y > y1;
                if (!are_left_of_face && !are_right_of_face && !are_infront_of_face && !are_behind_face && !are_above_face && !are_below_face)
                {
                    // intersects!
                    // console.log ("intersects top face!");
                    // save neighbor block so we know where to place a new block
                    pointed_at_block_neighbor = createVector (block_x, block_y+1, block_z);
                    // found a point - so stop looking
                    break;
                }
                // bottom
                x0 = world_x;
                x1 = world_x + BLOCK_WIDTH;
                y0 = world_y; // up is -y
                y1 = world_y;
                z0 = world_z;
                z1 = world_z + BLOCK_WIDTH;
                are_left_of_face = p_prev.x < x0 && p.x < x0;
                are_right_of_face = p_prev.x > x1 && p.x > x1;
                are_infront_of_face = p_prev.z > z1 && p.z > z1;
                are_behind_face = p_prev.z < z0 && p.z < z0;
                are_above_face = p_prev.y < y0 && p.y < y0;
                are_below_face = p_prev.y > y1 && p.y > y1;
                if (!are_left_of_face && !are_right_of_face && !are_infront_of_face && !are_behind_face && !are_above_face && !are_below_face)
                {
                    // intersects!
                    // console.log ("intersects bottom face!");
                    // save neighbor block so we know where to place a new block
                    pointed_at_block_neighbor = createVector (block_x, block_y-1, block_z);
                    // found a point - so stop looking
                    break;
                }
                // found a point - so stop looking
                break;
            }
            p_prev = p;
        }
    }

    // draws the player's model
    draw ()
    {
        this.inventory.draw ();
    }
}


// equation from https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-plane-and-ray-disk-intersection.html
// returns a tuple of t and a boolean of whether there was an intersection or not
// this assumes that vectors are normalized
function calc_ray_plane_intersection (plane_normal, plane_point, line_origin, line_vec)
{
    let denom = p5.Vector.dot (plane_normal, line_vec);
    if (denom > 1e-6)
    {
        let t = p5.Vector.dot (p5.Vector.sub (plane_point, line_origin), plane_normal) / denom;
        return [t, (t >= 0)];
    }
    return [0, false];
}

// returns true if the two given 3D axis-aligned bounding boxes are colliding
// false otherwise
function AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax)
{
    return (
        axmin <= bxmax &&
        axmax >= bxmin &&
        aymin >= bymax && // up is -y so flipped <=
        aymax <= bymin && // up is -y so flipped >=
        azmin <= bzmax &&
        azmax >= bzmin
    );
}