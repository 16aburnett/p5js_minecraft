// Minecraft in P5.js
// Items
// Author: Amy Burnett
//========================================================================
// Globals

const ITEM_STACK_AMT_MAX = 64;

//========================================================================

// inventory-storeable version of things in the world
class Item
{
    constructor (item_id)
    {
        this.item_id = item_id;
        // for tools that depleat over uses
        this.usages = 0;
    }

    // draws the item's icon
    draw (x, y, width)
    {
        let icon = map_block_id_to_block_static_data.get (this.item_id).texture_img_data[TEXTURE_TOP];
        image (icon, x, y, width, width);
    }
}

//========================================================================

// For saving space, similar items can be stacked together in one inventory slot.
class ItemStack
{
    constructor (item, amount)
    {
        this.item = item;
        this.amount = amount;
        this.max_amount = 64;
    }

    get_item_type ()
    {
        return this.item.item_id;
    }

    draw (x, y, width)
    {
        // draw item icon
        this.item.draw (x, y, width);
        // draw stack count
        fill (255);
        stroke (0);
        strokeWeight (5);
        textSize (width/2);
        textAlign (RIGHT, BOTTOM);
        text (this.amount.toString (), x + width, y + width);
    }
}

//========================================================================

// Represents a dropped item in the world
class ItemEntity
{
    constructor (item_stack)
    {
        this.item_stack = item_stack;

        this.position = createVector (0, 0, 0);
        this.velocity = createVector (0, 0, 0);

        this.air_friction_factor = 0.99;
        // this really should be queried from the block
        // that this item is on
        this.ground_friction_factor = 0.50;
        
        this.is_falling = true;

        // angle for rotating item entity over time
        this.rotate_angle = 0;
        this.rotation_speed = radians (1);

        this.width = BLOCK_WIDTH/2;
        this.height = BLOCK_WIDTH/2;

        // when this entity is created, it cannot be collected for at least 1 second
        // this is to ensure that we cannot pickup an item as soon as we throw it
        // bc that would defeat the purpose
        this.collect_delay = 1.0;
    }

    set_position (x, y, z)
    {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    add_velocity (x, y, z)
    {
        this.velocity.x += x;
        this.velocity.y += y;
        this.velocity.z += z;
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

    update ()
    {
        // rotate item entity further
        this.rotate_angle = (this.rotate_angle + this.rotation_speed) % (2*PI);

        // apply gravity force if we are falling
        if (this.is_falling)
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
        
        // apply air friction
        // ignore y direction, gravity will handle that
        this.velocity.mult (createVector (this.air_friction_factor, 1, this.air_friction_factor));
        // apply ground friction if on ground
        if (!this.is_falling)
            this.velocity.mult (createVector (this.ground_friction_factor, 1, this.ground_friction_factor));

        // save previous position - for checking collisions between prev and next position
        let prev_position = createVector (this.position.x, this.position.y, this.position.z);
        // apply velocity
        // scaled by delta time to make movement independent of frameRate
        this.position.add (p5.Vector.mult (this.velocity, deltaTime/1000));

        // Collisions detection + correction
        // check X direction
        if (prev_position.x != this.position.x)
        {
            // check left
            let [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x-this.width/2, this.position.y-this.height/2, this.position.z);
            let block_type = world.get_block_type (block_xi, block_yi, block_zi);
            if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
            {
                let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB ();
                let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                if (is_colliding)
                {
                    // console.log ("Colliding left!");
                    // correct collision
                    this.position.x = bxmax+this.width/2;
                    // ensure we aren't still moving in this direction
                    this.velocity.x = 0;
                }
            }
            // check right
            [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x+this.width/2, this.position.y-this.height/2, this.position.z);
            block_type = world.get_block_type (block_xi, block_yi, block_zi);
            if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
            {
                let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB ();
                let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                if (is_colliding)
                {
                    // console.log ("Colliding right!");
                    // correct collision
                    this.position.x = bxmin-this.width/2;
                    // ensure we aren't still moving in this direction
                    this.velocity.x = 0;
                }
            }
        }

        // check Y direction if we moved in y direction
        // assume we are falling and correct if collided with ground
        this.is_falling = true;
        if (prev_position.y != this.position.y)
        {
            // check down
            let [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x, this.position.y, this.position.z);
            let block_type = world.get_block_type (block_xi, block_yi, block_zi);
            if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
            {
                let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB ();
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
                }
            }
            // check up
            [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x, this.position.y-this.height, this.position.z);
            block_type = world.get_block_type (block_xi, block_yi, block_zi);
            if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
            {
                let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB ();
                let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                if (is_colliding)
                {
                    // console.log ("Colliding up!");
                    // correct collision
                    this.position.y = bymin+this.height+0.1; // add 0.1 extra padding due to camera
                    // ensure we aren't still moving in this direction
                    this.velocity.y = 0;
                }
            }
        }

        // check Z direction
        if (prev_position.z != this.position.z)
        {
            // check forward
            let [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x, this.position.y-this.height/2, this.position.z+this.width/2);
            let block_type = world.get_block_type (block_xi, block_yi, block_zi);
            if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
            {
                let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB ();
                let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                if (is_colliding)
                {
                    // console.log ("Colliding forward!");
                    // correct collision
                    this.position.z = bzmin-this.width/2;
                    // ensure we aren't still moving in this direction
                    this.velocity.z = 0;
                }
            }
            // check back
            [block_xi, block_yi, block_zi] = convert_world_to_block_index (this.position.x, this.position.y-this.height/2, this.position.z-this.width/2);
            block_type = world.get_block_type (block_xi, block_yi, block_zi);
            if (block_type != null && block_type != BLOCK_ID_AIR && block_type != BLOCK_ID_WATER)
            {
                let [axmin, axmax, aymin, aymax, azmin, azmax] = this.get_AABB ();
                let [bxmin, bxmax, bymin, bymax, bzmin, bzmax] = world.get_block_AABB (block_xi, block_yi, block_zi);
                let is_colliding = AABB_collision (axmin, axmax, aymin, aymax, azmin, azmax, bxmin, bxmax, bymin, bymax, bzmin, bzmax);
                if (is_colliding)
                {
                    // console.log ("Colliding back!");
                    // correct collision
                    this.position.z = bzmax+this.width/2;
                    // ensure we aren't still moving in this direction
                    this.velocity.z = 0;
                }
            }
        }

        // decrement collect delay
        if (this.collect_delay > 0.0)
        {
            let frame_time_s = 1 / frameRate ();
            this.collect_delay -= frame_time_s;
        }
    }

    draw ()
    {
        // draw AABB
        if (is_in_debug_mode)
        {
            graphics.translate (this.position.x, this.position.y-this.height/2, this.position.z);
            graphics.noFill ();
            graphics.stroke (255, 0, 0);
            graphics.strokeWeight (2);
            graphics.box (this.width, this.height, this.width);
            graphics.translate (-this.position.x, -(this.position.y-this.height/2), -this.position.z);
        }

        // draw item plane
        // **we can make the item a 3D shape later
        graphics.translate (this.position.x, this.position.y-this.height/2, this.position.z);
        graphics.rotateY (this.rotate_angle);
        let texture = map_block_id_to_block_static_data.get (this.item_stack.get_item_type ()).texture_img_data[TEXTURE_TOP];
        graphics.noFill ();
        graphics.noStroke ();
        graphics.texture (texture);
        graphics.plane (this.width, this.height);
        // draw stack amount if >1
        // if (this.item_stack.amount < 1)
        // {
        //     // webgl text seems to do similar to createGraphics but has a larger plane
        //     // but this also seems to slightly hurt performance so this is commented out
        //     let text = createGraphics (100, 100);
        //     text.fill (255);
        //     text.stroke (0);
        //     text.strokeWeight (2);
        //     text.textFont (overlay_font);
        //     text.textSize (50);
        //     text.text (this.item_stack.amount, text.width/2, text.height/2);
        //     graphics.translate (0, 0, 0.02);
        //     graphics.texture (text);
        //     graphics.plane (this.width, this.height);
        //     graphics.translate (0, 0, -0.02);
        // }
        graphics.rotateY (-this.rotate_angle);
        graphics.translate (-this.position.x, -(this.position.y-this.height/2), -this.position.z);

    }
}