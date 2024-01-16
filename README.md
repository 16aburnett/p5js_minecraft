# P5js MineCraft
Author: Amy Burnett

This is just a fun project where I attempt to make a MineCraft-like voxel game using P5js. This project is just for fun and exploration into game development and is just a nice challenge.

[P5js](https://p5js.org/) is a creative coding JavaScript library for HTML canvas graphics. P5js has support for WebGL for 3D scenes which enables me to make a 3D voxel world.

P5js is JavaScript, so I do not expect decent performance compared to if this was made in C++ with OpenGL. For context, simply drawing a 16x16x16 chunk of untextured, unoptimized blocks drops down to below 25 frames per second on a 12th Gen Intel(R) Core(TM) i7-1265U. There are many optimizations that I have applied to the main game (and possibly more optimizations to come), but it still runs very slowly.

# Github Usage

Since this project (and P5js) is written in JavaScript, you can run it directly from GitHub by going to the following link.

https://16aburnett.github.io/p5js_minecraft/code/

This will run the game (the JavaScript) on your local computer.

But note that there is currently no way to save or load games.

# Local Usage

You can also download the code and start your own server to run the game locally. Example below that uses a Python HTTP server:

```bash
# obtain the source code
git clone git@github.com:16aburnett/p5js_minecraft.git
cd p5js_minecraft/code/
# start a server
python3 -m http.server
```

After starting the server, you should be able to play the game by going to http://localhost:8000/.
