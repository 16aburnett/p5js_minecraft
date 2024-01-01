// Minecraft in P5.js
// Inventory system
// Author: Amy Burnett
//========================================================================
// Globals

const ITEM_STACK_AMT_MAX = 64;

//========================================================================

// A useable item
class Item
{
    constructor (item_id)
    {
        this.item_id = item_id;
    }

    // draws the item's icon
    draw ()
    {
        
    }
}

// For saving space, similar items can be stacked together in one inventory slot.
class ItemStack
{
    constructor ()
    {

    }
}

// An inventory is an interactable container that stores items
class Inventory
{
    constructor (rows=3, cols=9)
    {
        this.rows = rows;
        this.cols = cols;
        this.slots = this.rows * this.cols;
        this.item_ids = new Array (this.slots).fill (BLOCK_ID_NONE);
        this.item_amounts = new Array (this.slots).fill (0);
    }

    // adds an item to the inventory wherever there is space
    // either merging into existing item stacks or added to the end of the inventory
    add_item (incoming_item_stack)
    {
        
    }

    // adds
    add_item_at (i, j)
    {

    }
}


// A player inventory consists of 2 inventories: a hotbar and the extra storage
class PlayerInventory
{
    constructor ()
    {

    }
}