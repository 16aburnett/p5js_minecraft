// Minecraft in P5.js
// Inventory system
// Author: Amy Burnett
//========================================================================
// Globals

//========================================================================

// An inventory is an interactable container that stores items
class Inventory
{
    constructor (rows, cols)
    {
        this.rows = rows;
        this.cols = cols;
        this.num_slots = this.rows * this.cols;
        // the spaces for the items
        this.slots = new Array (this.num_slots).fill (null);
        this.is_pressing = false;
        this.pressed_i = 0;
        this.pressed_j = 0;
    }

    get_2D_array ()
    {
        let grid = [];
        for (let i = 0; i < this.rows; ++i)
        {
            grid.push ([]);
            for (let j = 0; j < this.cols; ++j)
            {
                grid[i].push (this.slots[i * this.cols + j]);
            }
        }
        return grid;
    }

    // adds an item to the inventory wherever there is space
    // either merging into existing item stacks or added to the end of the inventory
    add_item (incoming_item_stack)
    {
        for (let i = 0; i < this.slots.length; ++i)
        {
            // empty slot
            if (this.slots[i] == null)
            {
                // just add to slot
                this.slots[i] = incoming_item_stack;
                // no leftovers to return
                return null;
            }
            // same item type - coalesce stacks
            if (this.slots[i].item.item_id == incoming_item_stack.item.item_id)
            {
                let max_count = map_block_id_to_block_static_data.get (this.slots[i].item.item_id).stack_max_size;
                this.slots[i].amount += incoming_item_stack.amount;
                // ensure we didnt exceed max count
                if (this.slots[i].amount > max_count)
                {
                    // save leftover amount and move on to more slots
                    incoming_item_stack.amount = this.slots[i].amount - max_count;
                    this.slots[i].amount = max_count;
                }
                else
                {
                    // didnt exceed - nothing remaining to add
                    incoming_item_stack = null;
                    return null;
                }
            }
        }
        return incoming_item_stack;
    }

    // adds item at index and returns overflow or the previously stored item
    add_item_at (i, j, incoming_item_stack)
    {
        // ensure valid position
        if (!(i < this.rows && j < this.cols && i >= 0 && j >= 0))
            // return back the same thing since we couldn't store it
            return incoming_item_stack;
        let prev_item_stack = this.slots[i * this.cols + j];
        // ** for right now, just swap the stacks
        this.slots[i * this.cols + j] = incoming_item_stack;
        return prev_item_stack;
    }

    get_item_at (i, j)
    {
        // ensure valid position
        if (!(i < this.rows && j < this.cols && i >= 0 && j >= 0))
            return null;
        return this.slots[i * this.cols + j];
    }

    pressed (x, y, cell_width, cell_padding)
    {
        // assume we didnt press this inventory
        this.is_pressing = false;
        // now try to disprove our assumption
        for (let i = 0; i < this.rows; ++i)
        {
            for (let j = 0; j < this.cols; ++j)
            {
                let x0 = x + j * cell_width + j*cell_padding;
                let y0 = y + i * cell_width + i * cell_padding;
                let x1 = x0 + cell_width;
                let y1 = y0 + cell_width;
                // check if mouse is over this cell
                if (x0 <= mouseX && mouseX <= x1 && y0 <= mouseY && mouseY <= y1)
                {
                    // mouse pressed on this cell
                    this.is_pressing = true;
                    this.pressed_i = i;
                    this.pressed_j = j;
                }
            }
        }
        return this.is_pressing;
    }

    released (x, y, cell_width, cell_padding)
    {
        // ignore if we werent pressing on this cell
        if (!this.is_pressing)
            return false;
        // mouse is releasing so we arent pressing anymore
        this.is_pressing = false;
        // find out if we released over one of the cells
        for (let i = 0; i < this.rows; ++i)
        {
            for (let j = 0; j < this.cols; ++j)
            {
                let x0 = x + j * cell_width + j*cell_padding;
                let y0 = y + i * cell_width + i * cell_padding;
                let x1 = x0 + cell_width;
                let y1 = y0 + cell_width;
                // check if mouse is over this cell
                if (x0 <= mouseX && mouseX <= x1 && y0 <= mouseY && mouseY <= y1)
                {
                    // mouse released on this cell
                    // ensure that this was the cell that we pressed originally
                    if (this.pressed_i == i && this.pressed_j == j)
                    {
                        // left click
                        if (mouseButton === LEFT)
                        {
                            // swap mouse hand with cell
                            let slot_item = this.slots[i * this.cols + j];
                            let hand_item = picked_up_item;
                            // combine item stacks if they are the same type
                            if (slot_item != null && hand_item != null && slot_item.item.item_id == hand_item.item.item_id)
                            {
                                let max_count = map_block_id_to_block_static_data.get (slot_item.item.item_id).stack_max_size;
                                hand_item.amount += slot_item.amount;
                                // ensure we didnt exceed max count
                                if (hand_item.amount > max_count)
                                {
                                    slot_item.amount = hand_item.amount - max_count;
                                    hand_item.amount = max_count;
                                }
                                else
                                {
                                    slot_item = null;
                                }
                            }
                            // write out items
                            this.slots[i * this.cols + j] = hand_item;
                            picked_up_item = slot_item;
                        }
                        // right click
                        // (ignore if not allowed to drop items)
                        if (mouseButton === RIGHT)
                        {
                            // drop only one item
                            // ensure we have items to drop
                            if (picked_up_item != null)
                            {
                                // ensure the cell is empty or contains the same type of item (and has space)
                                let max_count = map_block_id_to_block_static_data.get (picked_up_item.item.item_id).stack_max_size;
                                if (this.slots[i * this.cols + j] == null || (this.slots[i * this.cols + j].item.item_id == picked_up_item.item.item_id && this.slots[i * this.cols + j].amount < max_count))
                                {
                                    // place one item from hand
                                    // create item stack with 1 item if it doesnt exist
                                    if (this.slots[i * this.cols + j] == null)
                                        this.slots[i * this.cols + j] = new ItemStack (new Item (picked_up_item.item.item_id), 1);
                                    // add one to cell
                                    else
                                        this.slots[i * this.cols + j].amount++;
                                    picked_up_item.amount--;
                                    // ensure hand is empty if we run out of items
                                    if (picked_up_item.amount <= 0)
                                        picked_up_item = null;
                                }
                            }
                        }

                    }
                }
            }
        }
    }

    draw (x, y, cell_width, cell_padding)
    {
        // draw each cell of this inventory in a 2D grid
        for (let i = 0; i < this.rows; ++i)
        {
            for (let j = 0; j < this.cols; ++j)
            {
                let cell_x = x + j * cell_width + j * cell_padding;
                let cell_y = y + i * cell_width + i * cell_padding;
                // default cell color
                fill ("#bbb");
                // highlight (change color) if mouse is hovering over cell
                let is_mouse_over_cell = cell_x < mouseX && mouseX < cell_x+cell_width &&
                    cell_y < mouseY && mouseY < cell_y+cell_width;
                if (is_mouse_over_cell)
                    fill ("#999");
                noStroke ();
                // draw cell background
                rect (cell_x, cell_y, cell_width, cell_width);
                // draw item in cell (if there is one)
                if (this.get_item_at (i, j) != null)
                    this.get_item_at (i, j).draw (cell_x, cell_y, cell_width);
            }
        }
    }
}

//========================================================================

// we have a separate inventory for crafting to have different mechanics
// like showing the crafting result of blocks in the crafting grid
// and only allowing the result to be taken and not allowing blocks to be placed
class CraftingOutputInventory
{
    constructor (input)
    {
        // saves a reference to the input inventory
        this.input_inventory = input;
        this.output = null;
        this.is_pressing = false;
    }

    pressed (x, y, cell_width, cell_padding)
    {
        // assume we didnt press this inventory
        this.is_pressing = false;
        // now try to disprove our assumption
        // check if mouse is over this cell
        if (x <= mouseX && mouseX <= x+cell_width && y <= mouseY && mouseY <= y+cell_width)
        {
            // mouse pressed on this cell
            this.is_pressing = true;
        }

        return this.is_pressing;
    }

    released (x, y, cell_width, cell_padding)
    {
        // ignore if we werent pressing on this cell
        if (!this.is_pressing)
            return false;
        // mouse is releasing so we arent pressing anymore
        this.is_pressing = false;
        // check if mouse is over this cell
        if (x <= mouseX && mouseX <= x+cell_width && y <= mouseY && mouseY <= y+cell_width)
        {
            // mouse released on this cell
            // left click
            if (mouseButton === LEFT)
            {
                // ensure it is a valid recipe
                // and get the output
                let output = get_crafting_output (this.input_inventory.get_2D_array ());
                if (output == null)
                    // not a valid crafting recipe
                    // just fail fast here
                    return true;

                // ensure player has space in hand for crafted items
                let has_item = picked_up_item != null;
                let has_diff_item = has_item && picked_up_item.item.item_id != output.item.item_id;
                let has_not_enough_stack_space = has_item && !has_diff_item && (picked_up_item.amount + output.amount > map_block_id_to_block_static_data.get (picked_up_item.item.item_id).stack_max_size);
                if (has_diff_item || has_not_enough_stack_space)
                    return true;

                // this is a valid crafting recipe,
                // and the player pressed and released the mouse
                // over the crafting output cell.
                // so complete the craft and give the player the
                // resulting crafted item

                // complete crafting item - consume items from input
                for (let i = 0; i < this.input_inventory.num_slots; ++i)
                {
                    if (this.input_inventory.slots[i] != null)
                    {
                        // decrement item count
                        --this.input_inventory.slots[i].amount;
                        // ensure item is removed if it ran out of items
                        if (this.input_inventory.slots[i].amount <= 0)
                        this.input_inventory.slots[i] = null;
                    }
                }

                // put item stack into player's hand (cursor)
                // *copy() so that we have a unique reference
                if (picked_up_item == null)
                    picked_up_item = output.copy ();
                // or coalesce stacks
                else
                    picked_up_item.amount += output.amount;
            }
            // right click
            if (mouseButton === RIGHT)
            {
                // do nothing
            }
        }
    }

    draw (x, y, cell_width, cell_padding)
    {
        let cell_x = x;
        let cell_y = y;
        // default cell color
        fill ("#bbb");
        // highlight (change color) if mouse is hovering over cell
        let is_mouse_over_cell = cell_x < mouseX && mouseX < cell_x+cell_width &&
            cell_y < mouseY && mouseY < cell_y+cell_width;
        if (is_mouse_over_cell)
            fill ("#999");
        noStroke ();
        // draw cell background
        rect (cell_x, cell_y, cell_width, cell_width);
        // draw item in cell (if there is one)
        if (this.output != null)
            this.output.draw (cell_x, cell_y, cell_width);
    }
}

//========================================================================

class CraftingTableDisplay
{
    constructor ()
    {
        this.crafting_input_inventory = new Inventory (3, 3);
        this.crafting_output_inventory = new CraftingOutputInventory (this.crafting_input_inventory);
    }

    pressed (x, y, cell_width, cell_padding)
    {
        // crafting input
        let input_x = x + cell_width + cell_padding;
        let input_y = y + 0.5 * (cell_width + cell_padding);
        this.crafting_input_inventory.pressed (input_x, input_y, cell_width, cell_padding);
        
        // crafting output
        let output_x = x + 6 * (cell_width + cell_padding);
        let output_y = y + 1.5 * (cell_width + cell_padding);
        this.crafting_output_inventory.pressed (output_x, output_y, cell_width, cell_padding);
    }

    released (x, y, cell_width, cell_padding)
    {
        // crafting input
        let input_x = x + cell_width + cell_padding;
        let input_y = y + 0.5 * (cell_width + cell_padding);
        this.crafting_input_inventory.released (input_x, input_y, cell_width, cell_padding);
        
        // crafting output
        let output_x = x + 6 * (cell_width + cell_padding);
        let output_y = y + 1.5 * (cell_width + cell_padding);
        this.crafting_output_inventory.released (output_x, output_y, cell_width, cell_padding);

        // update crafting output value with recipe results
        let output = get_crafting_output (this.crafting_input_inventory.get_2D_array ());
        this.crafting_output_inventory.output = output;
    }

    draw (x, y, cell_width, cell_padding)
    {
        textAlign (LEFT, TOP);
        textSize (cell_width * 0.5);
        fill ("black");
        noStroke ();
        text ("Crafting", x + 1 * (cell_width + cell_padding), y);

        // draw input
        let input_x = x + cell_width + cell_padding;
        let input_y = y + 0.5 * (cell_width + cell_padding);
        this.crafting_input_inventory.draw (input_x, input_y, cell_width, cell_padding);
        
        // draw arrow
        let arrow_x = x + 4.5 * (cell_width + cell_padding);
        let arrow_y = y + 1.5 * (cell_width + cell_padding);
        let arrow_rect_width = cell_width / 2 - cell_padding;
        let arrow_rect_height = cell_width / 4;
        fill ("#bbb");
        noStroke ();
        rect (arrow_x, arrow_y + 0.5 * cell_width - arrow_rect_height/2, arrow_rect_width, arrow_rect_height);
        triangle (
            arrow_x + arrow_rect_width-1, arrow_y + cell_padding, // top left point
            arrow_x + 1.0*cell_width - cell_padding, arrow_y + cell_width/2, // middle right point
            arrow_x + arrow_rect_width-1, arrow_y + cell_width - cell_padding // bottom left point
        );

        // draw output
        let output_x = x + 6 * (cell_width + cell_padding);
        let output_y = y + 1.5 * (cell_width + cell_padding);
        this.crafting_output_inventory.draw (output_x, output_y, cell_width, cell_padding);
    }
}

//========================================================================

// A player inventory consists of 2 inventories: a hotbar and the extra storage
class InventoryDisplay
{
    constructor ()
    {
        this.width = 600;
        this.height = 600;
        this.content = null;
    }

    pressed ()
    {
        let smaller_dim = min (width, height);
        let display_margin_top = 50;
        let display_height = smaller_dim - 2 * display_margin_top;
        let display_width = display_height;

        let padding = display_height / 9 / 4;
        let cell_padding = padding / 4;
        let cell_width = (display_height - 2*padding) / 9 - cell_padding;
        // correct dimensions (fence post problem)
        display_width = display_width - cell_padding;
        display_height = display_height - cell_padding;

        // background of popup display
        let x = width / 2 - display_width / 2;
        let y = height / 2 - display_height / 2;

        // ensure mouse was pressed over the inventory
        if (mouseX < x || mouseX > x + display_width || mouseY < y || mouseY > y + display_height)
            return false;

        // draw top section
        // top section of the inventory can change
        if (this.content == null)
        {
            // player equipment
            let armor_x = x + padding;
            let armor_y = y + padding;
            player.equipment.pressed (armor_x, armor_y, cell_width, cell_padding);
            let crafting_in_x = x + padding + 5 * (cell_width + cell_padding);
            let crafting_in_y = y + padding + 0.5 * (cell_width + cell_padding);
            player.crafting_inventory_in.pressed (crafting_in_x, crafting_in_y, cell_width, cell_padding);
            let crafting_out_x = x + padding + 8 * (cell_width + cell_padding);
            let crafting_out_y = y + padding + 1 * (cell_width + cell_padding);
            player.crafting_inventory_out.pressed (crafting_out_x, crafting_out_y, cell_width, cell_padding);
        }
        else
        {
            this.content.pressed (x + padding, y + padding, cell_width, cell_padding);
        }

        // draw player inventory
        let inventory_x = x + padding;
        let inventory_y = y + display_height / 2 + padding;
        player.inventory.pressed (inventory_x, inventory_y, cell_width, cell_padding);

        // draw player hotbar
        let hotbar_x = inventory_x;
        let hotbar_y = inventory_y + cell_width + (cell_width + cell_padding) * (3-1) + padding;
        player.hotbar.pressed (hotbar_x, hotbar_y, cell_width, cell_padding);

        return true;
    }

    released ()
    {
        let smaller_dim = min (width, height);
        let display_margin_top = 50;
        let display_height = smaller_dim - 2 * display_margin_top;
        let display_width = display_height;

        let padding = display_height / 9 / 4;
        let cell_padding = padding / 4;
        let cell_width = (display_height - 2*padding) / 9 - cell_padding;
        // correct dimensions (fence post problem)
        display_width = display_width - cell_padding;
        display_height = display_height - cell_padding;

        // background of popup display
        let x = width / 2 - display_width / 2;
        let y = height / 2 - display_height / 2;

        // ensure mouse was released over the inventory
        if (mouseX < x || mouseX > x + display_width || mouseY < y || mouseY > y + display_height)
            return false;

        // draw top section
        // top section of the inventory can change
        if (this.content == null)
        {
            // player equipment
            let armor_x = x + padding;
            let armor_y = y + padding;
            player.equipment.released (armor_x, armor_y, cell_width, cell_padding);
            let crafting_in_x = x + padding + 5 * (cell_width + cell_padding);
            let crafting_in_y = y + padding + 0.5 * (cell_width + cell_padding);
            player.crafting_inventory_in.released (crafting_in_x, crafting_in_y, cell_width, cell_padding);
            let crafting_out_x = x + padding + 8 * (cell_width + cell_padding);
            let crafting_out_y = y + padding + 1 * (cell_width + cell_padding);
            player.crafting_inventory_out.released (crafting_out_x, crafting_out_y, cell_width, cell_padding);
            let output = get_crafting_output (player.crafting_inventory_in.get_2D_array ());
            player.crafting_inventory_out.output = output;
        }
        // custom content
        else
        {
            this.content.released (x + padding, y + padding, cell_width, cell_padding);
        }

        // draw player inventory
        let inventory_x = x + padding;
        let inventory_y = y + display_height / 2 + padding;
        player.inventory.released (inventory_x, inventory_y, cell_width, cell_padding);

        // draw player hotbar
        let hotbar_x = inventory_x;
        let hotbar_y = inventory_y + cell_width + (cell_width + cell_padding) * (3-1) + padding;
        player.hotbar.released (hotbar_x, hotbar_y, cell_width, cell_padding);

        return true;
    }

    update ()
    {
        let smaller_dim = min (width, height);
        let display_margin_top = 50;
        let display_height = smaller_dim - 2 * display_margin_top;
        let display_width = display_height;

        let padding = display_height / 9 / 4;
        let cell_padding = padding / 4;
        let cell_width = (display_height - 2*padding) / 9 - cell_padding;
        // correct dimensions (fence post problem)
        display_width = display_width - cell_padding;
        display_height = display_height - cell_padding;

        // background of popup display
        let x = width / 2 - display_width / 2;
        let y = height / 2 - display_height / 2;

        // nothing for now

    }

    draw ()
    {
        let smaller_dim = min (width, height);
        let display_margin_top = 50;
        let display_height = smaller_dim - 2 * display_margin_top;
        let display_width = display_height;

        let padding = display_height / 9 / 4;
        let cell_padding = padding / 4;
        let cell_width = (display_height - 2*padding) / 9 - cell_padding;
        // correct dimensions (fence post problem)
        display_width = display_width - cell_padding;
        display_height = display_height - cell_padding;

        // save cell width globally
        current_item_width = cell_width

        // background of popup display
        let x = width / 2 - display_width / 2;
        let y = height / 2 - display_height / 2;
        fill ("#eee");
        noStroke ();
        rect (x, y, display_width, display_height);

        // draw top section
        if (this.content == null) // no content
        {
            // top section of the inventory can change
            // player equipment
            let armor_x = x + padding;
            let armor_y = y + padding;
            player.equipment.draw (armor_x, armor_y, cell_width, cell_padding);
            // draw player view
            fill ("black");
            noStroke ();
            rect (armor_x + cell_width + cell_padding, armor_y, cell_width + (cell_padding + cell_width) * 2, cell_width + (cell_padding + cell_width) * 3);
            // draw player crafting grid
            textAlign (LEFT, TOP);
            textSize (cell_width * 0.5);
            fill ("black");
            noStroke ();
            text ("Crafting", x + padding + 5 * (cell_width + cell_padding), y + padding);
            let crafting_in_x = x + padding + 5 * (cell_width + cell_padding);
            let crafting_in_y = y + padding + 0.5 * (cell_width + cell_padding);
            player.crafting_inventory_in.draw (crafting_in_x, crafting_in_y, cell_width, cell_padding);
            // draw arrow
            let arrow_x = x + padding + 7 * (cell_width + cell_padding) + cell_padding;
            let arrow_y = y + padding + 1 * (cell_width + cell_padding);
            let arrow_rect_width = cell_width / 2 - cell_padding;
            let arrow_rect_height = cell_width / 4;
            fill ("#bbb");
            noStroke ();
            rect (arrow_x, arrow_y + 0.5 * cell_width - arrow_rect_height/2, arrow_rect_width, arrow_rect_height);
            triangle (
                arrow_x + arrow_rect_width-1, arrow_y + cell_padding, // top left point
                arrow_x + 1.0*cell_width - cell_padding, arrow_y + cell_width/2, // middle right point
                arrow_x + arrow_rect_width-1, arrow_y + cell_width - cell_padding // bottom left point
            );
            let crafting_out_x = x + padding + 8 * (cell_width + cell_padding);
            let crafting_out_y = y + padding + 1 * (cell_width + cell_padding);
            player.crafting_inventory_out.draw (crafting_out_x, crafting_out_y, cell_width, cell_padding);
        }
        else
            this.content.draw (x + padding, y + padding, cell_width, cell_padding);

        // draw player inventory
        let inventory_x = x + padding;
        let inventory_y = y + display_height / 2 + padding;
        player.inventory.draw (inventory_x, inventory_y, cell_width, cell_padding);

        // draw player hotbar
        let hotbar_x = inventory_x;
        let hotbar_y = inventory_y + cell_width + (cell_width + cell_padding) * (3-1) + padding;
        player.hotbar.draw (hotbar_x, hotbar_y, cell_width, cell_padding);

    }
}

//========================================================================
