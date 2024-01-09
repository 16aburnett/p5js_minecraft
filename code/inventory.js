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
        // this.next_free_space_index = 0;
        this.is_pressing = false;
        this.pressed_i = 0;
        this.pressed_j = 0;
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
        for (let i = 0; i < this.rows; ++i)
        {
            for (let j = 0; j < this.cols; ++j)
            {
                fill ("#bbb");
                noStroke ();
                rect (x + j * cell_width + j*cell_padding, y + i * cell_width + i * cell_padding, cell_width, cell_width);
                // draw item (if there is one)
                if (this.get_item_at (i, j) != null)
                    this.get_item_at (i, j).draw (x + j * cell_width + j*cell_padding, y + i * cell_width + i * cell_padding, cell_width);
            }
        }
    }
}

// A player inventory consists of 2 inventories: a hotbar and the extra storage
class InventoryDisplay
{
    constructor ()
    {
        this.width = 600;
        this.height = 600;
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
        // player equipment
        let armor_x = x + padding;
        let armor_y = y + padding;
        player.equipment.pressed (armor_x, armor_y, cell_width, cell_padding);

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
        // player equipment
        let armor_x = x + padding;
        let armor_y = y + padding;
        player.equipment.released (armor_x, armor_y, cell_width, cell_padding);

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

    updated ()
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
        // top section of the inventory can change
        // player equipment
        let armor_x = x + padding;
        let armor_y = y + padding;
        player.equipment.draw (armor_x, armor_y, cell_width, cell_padding);
        // draw player view
        fill ("black");
        rect (armor_x + cell_width + cell_padding, armor_y, cell_width + (cell_padding + cell_width) * 2, cell_width + (cell_padding + cell_width) * 3);

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