// Minecraft in P5.js
// Inventory system
// Author: Amy Burnett
//========================================================================
// Globals

let recipes = [];

//========================================================================

class Recipe
{
    constructor (input, output)
    {
        this.input = input;
        this.output = output;
        this.rows = input.length;
        // **this might not be ideal because this assumes that the user 
        // inputted a non-jagged 2D array
        this.cols = input[0].length;
    }

    match (other_input)
    {
        // ensure that dimensions match
        if (other_input.length != this.rows || other_input[0].length != this.cols)
            return false;
        // ensure each item matches
        for (let i = 0; i < this.rows; ++i)
            for (let j = 0; j < this.cols; ++j)
                if (other_input[i][j] != this.input[i][j])
                    return false;
        // all items match so the given input matches this recipe
        return true;
    }
}

//========================================================================

function crafting_setup ()
{
    recipes.push (new Recipe (
        [[BLOCK_ID_LOG]],
        new ItemStack (new Item (BLOCK_ID_WOODEN_PLANKS), 4)
    ));
    recipes.push (new Recipe (
        [[BLOCK_ID_WOODEN_PLANKS],
        [BLOCK_ID_WOODEN_PLANKS]],
        new ItemStack (new Item (ITEM_ID_STICK), 16)
    ));
    recipes.push (new Recipe (
        [[BLOCK_ID_WOODEN_PLANKS, BLOCK_ID_WOODEN_PLANKS],
        [BLOCK_ID_WOODEN_PLANKS, BLOCK_ID_WOODEN_PLANKS]],
        new ItemStack (new Item (BLOCK_ID_CRAFTING_TABLE), 1)
    ));
    recipes.push (new Recipe (
        [
            [BLOCK_ID_COBBLESTONE, BLOCK_ID_COBBLESTONE, BLOCK_ID_COBBLESTONE],
            [null, ITEM_ID_STICK, null],
            [null, ITEM_ID_STICK, null]
        ],
        new ItemStack (new Item (ITEM_ID_STONE_PICKAXE), 1)
    ));
}

//========================================================================

function get_crafting_output (input_grid)
{
    let rows = input_grid.length;
    let cols = input_grid[0].length;
    // Reduce grid to bounding box
    let i_min = -1;
    let j_min = -1;
    let i_max = -1;
    let j_max = -1;
    // find left
    for (let j = 0; j < cols; ++j)
    {
        let was_found = false;
        for (let i = 0; i < rows; ++i)
        {
            if (input_grid[i][j] != null)
            {
                j_min = j;
                was_found = true;
                break;
            }
        }
        if (was_found)
            break;
    }
    // find top
    for (let i = 0; i < rows; ++i)
    {
        let was_found = false;
        for (let j = 0; j < cols; ++j)
        {
            if (input_grid[i][j] != null)
            {
                i_min = i;
                was_found = true;
                break;
            }
        }
        if (was_found)
            break;
    }
    // find right
    for (let j = cols-1; j >= 0; --j)
    {
        let was_found = false;
        for (let i = 0; i < rows; ++i)
        {
            if (input_grid[i][j] != null)
            {
                j_max = j;
                was_found = true;
                break;
            }
        }
        if (was_found)
            break;
    }
    // find bottom
    for (let i = rows-1; i >= 0; --i)
    {
        let was_found = false;
        for (let j = 0; j < cols; ++j)
        {
            if (input_grid[i][j] != null)
            {
                i_max = i;
                was_found = true;
                break;
            }
        }
        if (was_found)
            break;
    }

    // ensure there was at least one item in the grid
    if (i_min == -1 || i_max == -1 || j_min == -1 || j_max == -1)
        return null;

    // create bounding boxed input
    let bounding_box_input = [];
    for (let i = i_min; i < i_max+1; ++i)
    {
        bounding_box_input.push ([]);
        for (let j = j_min; j < j_max+1; ++j)
        {
            let item = input_grid[i][j] == null ? null : input_grid[i][j].item.item_id;
            bounding_box_input[bounding_box_input.length-1].push (item);
        }
    }
    
    // Check for matching recipe
    let output = null;
    for (let recipe of recipes)
    {
        if (recipe.match (bounding_box_input))
        {
            // console.log ("Matches!", recipe);
            output = recipe.output;
            // we found the match
            // so we can stop checking
            // (recipes should be unique)
            break;
        }
    }

    // if recipe matches, then output result, otherwise null
    return output;
}

//========================================================================
