## systems (offline)

js13k 2018 repo

tools are not included, expects advzip.exe, ccnew.jar (closure compiler), and shader_minifier.exe

vox models can be opened with magicavoxel

you can convert them to txt models with voxelbox in chiisai_js

## Post-mortem

TLDR: Tried to get engine and some of the game (without knowing the theme) done before I had to move into a new high school and wasn&#39;t able to finish in time.  Learned how to make a 3D game engine in webgl and made a format for voxel models that compresses well.  I can&#39;t surpass xem&#39;s postmortem from last year but I can try!

Right after the 2017 js13k comp ended (please don&#39;t look at mine from that year) I decided to look into ways that I could improve compression.  My game barely fit two levels and two songs with png compressors and 7z ultra compression.  I created a folder with some of the test files and found out that PPMd was pretty much superior to deflate when it comes to text.  Turns out Windows couldn&#39;t even extract it, so that idea was thrown out.

Later, in February, I decided that I was going to write a 3D game engine for this year&#39;s competition.  Many ideas had gone through my mind, and I wanted to make sure I got ahead so that I could have enough time to work on it with school starting (spoiler alert: I ran out of time.)  Originally it would be a first-person game in a city, trying to break some sort of curse (see possible inspiration, &quot;The Witch&#39;s Isle&quot;.)  That ended up sounding to complicated and wanted to change it up by making a puzzle game.  At first, it was going to be some kind of puzzle switcher.  At this point, the engine was already decided to be a voxel-based engine.  Only using a school Chromebook and Drive Notepad, I ran various tests to see what the best way would be to compress models.  The first arrow model seen in the chiisai repo in March was made only using drive notepad.  The original page was also made on that Chromebook, testing the model format in layers:

![arrow](https://user-images.githubusercontent.com/12544505/45582234-e0f88a00-b871-11e8-9f5f-bfa5b504f967.png)

The format explained (kind of):

![arrow explained](https://user-images.githubusercontent.com/12544505/45582236-e9e95b80-b871-11e8-83eb-220a9a9c0263.png)

(The repo model is &quot;17773034740213534012362400337340&quot;, so minus the 1777 and 0 at the end, it&#39;s been the same)

It was a start, but not by much.  The format involved drawing volumes from two different points.  The original format only allowed for 8x8x8 models.  Models also had to be created manually (see code in image above).  At first, creating a program to automatically do this for me seemed like something too difficult to actually make.  I started building levels sometime in the middle of January.  The idea was that there were walls in the way and you could flip to the other side but you would have to stay in the &quot;same location&quot;.  Pretty standard puzzle stuff.  For some reason I still have a screenshot of a MagicaVoxel render of the map in the repo:

![first map](https://user-images.githubusercontent.com/12544505/45582239-fa99d180-b871-11e8-9c08-481559bd019d.png)
 
(The funny thing is, this game was actually being called systems way before the theme was announced.  I guess I was lucky.)

After that was done, I spent a good amount of time trying to actually get some 3D working.  Originally, I wanted to try using CSS3D since I thought it would prevent me from having to learn WebGL and manually creating models.  After some fiddling, I decided that the performance hit and no shaders wasn&#39;t worth the size.  In somewhere in February I started to create some WebGL sample programs.

I mainly edited the MDN 3D WebGL tutorial to start the engine.  My biggest fear of making an engine was having matrix multiplication, inverse, etc. take up a lot of space.  Positioning and rotation have to have some kind of view matrix, and there are three ways you can do it:

1. Multiply matrices by individually calculating each cell (fast but large)
2. Multiply matrices by using for loops (slow but smaller)
3. Don&#39;t multiply matrices at all and precompute them

Before, I was using Mathway to try and solve for matrices. Eventually, I found Algebrite and was able to get the matrices multiplied beforehand instead of multiplying them at runtime.  This still took a lot of fixing and a week of headbanging, but eventually I got the spinning cube back into the scene without any weird bugs.

Once that was done, it was time to load the model in.  It didn&#39;t take too long and by no time I had a spinning arrow model from the one I created on the Chromebook.  Initially, the &quot;voxelizer&quot; created individual cubes, but this was later combined into the original volumes for performance reasons.

The spinning cube was great, but there was no camera.  The code I was using let me move objects around, but I couldn&#39;t look around.  It just wasn&#39;t a thing.  It was probably the end of March when I stopped development on building the engine.  A very crude prototype of voxelbox was created in Java that supported 8x8x8 models.  Color wasn&#39;t even supported until it was rewritten in C#.  It probably took two weeks for this to be finished as I had a lot of other things going on at this time and I kept messing up in the stupidest ways possible.

In April, the idea was breaking out of a prison. This is where the idea of using MagicaVoxel for designing the levels started.  The idea changed sometime around the end of May with an investigative horror game where you investigate a murder in a locked down hotel building.  I started designing a few of those levels in MagicaVoxel:

![second map](https://user-images.githubusercontent.com/12544505/45582243-04bbd000-b872-11e8-86c7-bc93f13b50a2.png)

(The room in the far back is in the chiisai repo.  This level was built off of that room after the first commit in July.)

Pretty late on in June, I found a website with a script that calculated a matrix from an eye position and rotation.  It worked perfectly first try and with a little modification I got my (no longer spinning) arrow with fps controls.  Here&#39;s the arrow model in the chiisai repo:

![arrow 3d](https://user-images.githubusercontent.com/12544505/45582264-5b290e80-b872-11e8-945d-3b04548161a2.png)

The format was created with numbers because I believed this would compress better than bytes, even if it meant taking up more space uncompressed (later, I actually learned how deflate actually worked and made a thermal view for zip files and a Huffman tree viewer).  The 8x8x8 limit was an artificial limit because of the ten digits.  At first, I wanted to try and avoid using anything bigger than 10x10x10 to avoid using letters.  I ended up adding support for it anyway to test a complex model: the MagicaVoxel icon model.  Other than a few minor color things, it worked mostly fine and I made my first commit on the repo.

The idea about the hotel stalled when I couldn&#39;t come up with anything interesting to do in such a small area and without the camera being blocked by walls.  Looking back, I probably could&#39;ve made something pretty cool out of it, but hey, what can I do about it now?  With other things going on (I just finished Hollow Knight around this time and was developing some tools for it), I only began working on the scene exporting tool in late July.  The front room of the ship was built and into the game in early August.  I started to move into the school around this time, so I didn&#39;t have much time to do anything for a while.

During the weekends we had free, I spent all day working on building levels and adding code.  A week after competition start and I had managed to get both the front and back of the interior part of the ship done, the menu, the svg converter, the UI, and the stars.  Originally the game was going to have an intro cinematic, but I didn&#39;t want to bore anyone and it would&#39;ve taken up valuable space for something that I could leave out.  The story was going to be put on the computer on the left but that never happened because I ran out of time.

![news](https://user-images.githubusercontent.com/12544505/45582255-3fbe0380-b872-11e8-8454-d761afb0d287.png)

(It was almost done too!  I don&#39;t know how I couldn&#39;t make the time for this.)

The game was also supposed to start out in a ship with red blinking lights where you would have to investigate the bottom half of the ship and repair it.  That also didn&#39;t get added so there&#39;s just an empty room on the bottom that doesn&#39;t do anything.

Eventually, I got around to making the planets.  I had no idea what I was going to put on them, so I just put security cameras because why not right?  Using the new model rotation added recently, I was able to get a camera and &quot;laser&quot; or line of sight added.  I had to manually place them by guessing but at least I was able to get them working at all.  The cameras didn&#39;t do anything at all until the last week when they were poorly added with a restart (I wanted the room to turn red and a fade to black but nope).

The shooting scenes were also going to be before you reach the base.  I could&#39;ve done that, but I don&#39;t exactly remember why I switched it at the last second.  Regardless, I think those turned out okay.  Originally there were going to be lives, but I ran out of time for that too and just added a score counter on the last day.

The space station was originally much bigger too.  It was going to be where you find various items in beakers around the lab and mix it to create a substance to open a safe (see possible inspiration, &quot;Submachine 4&quot;).

![old station](https://user-images.githubusercontent.com/12544505/45582278-7b58cd80-b872-11e8-9d52-ebc4c300bd00.png)

(The models in the lab on the space station were first.  I ended up copying them over to the bases.)

A problem I started running into around this time was my terrible management of models.  The idea initially was to have scene and model generation automatically edit the data.js file, but I ended up copying all of the codes and scenes manually into the file.  At least six or seven times I ran out of space in the array and had to increase the limit while pushing all of the indexes pointing to the data after it up.  It was a pretty stupid idea to put it all in one array, but I didn&#39;t want to risk messing anything up.

For the second time in a row, I went home on the weekend and uploaded the wrong file for the project and left the correct one back at school.  I lost a bit of time but tried to design new levels and combine them later on.  I couldn&#39;t think of any cool way to make the cameras new without becoming stale, so I took a risk and tried to make cameras go through walls:

![welp](https://user-images.githubusercontent.com/12544505/45582279-87dd2600-b872-11e8-9451-8505c73da0b6.png)

Obviously, it wasn&#39;t as simple as just putting a wall there, but it was still a problem.  The problem still never really got fixed.  It involved placing boxes in the range of the camera I wanted to block and use some GL magic to block the laser from showing.

![reddit](https://user-images.githubusercontent.com/12544505/45582280-8d3a7080-b872-11e8-88cc-a6be378ada84.png)

(Yes, I got this idea from a Minecraft reddit post.)

The last few days were pretty busy too.  I already had 3 essays and a presentation due and I was wasting time on a game that was hardly done.  A week before, I taught one of my friends how to build some bases in MagicaVoxel.  The levels got built, but some of them were the wrong direction and some were floating.  For some reason I never had that problem and just lucked out that all of my levels were in the right direction on the right vertical offset.  The offset was an easy fix, but all of the maps had to be manually rotated since MagicaVoxel&#39;s rotate function just gives the models a rotate value, rather than actually rotating the model.  The last two days before the competition were adding the cameras and wiring up the terminals along with docking.

The last day I did pretty much everything.  I set up some bad tutorials, redid the space station and created the water, acid, and space shooting scenes.  It was 11:30pm when I decided to make the boss the &quot;Space Octopus&quot;.  I dunno why he looks so happy but here he is:

![space octopus](https://user-images.githubusercontent.com/12544505/45582283-94fa1500-b872-11e8-8c6d-d8b2cae5a9d3.png)

He was supposed to be much harder but I had no time to playtest with lights out soon.  I cobbled everything together, compiled it (unsurprisingly at 12kb, could&#39;ve been smaller), and uploaded it without testing it at all past the main menu.  If I had taken a little bit more time to test it I would&#39;ve noticed that everything was way too dark.  To see what size my game was currently at, I would copy over the precompressed shaders into the small js file.  My folder was getting a bit disorganized as the competition went on:

![folder](https://user-images.githubusercontent.com/12544505/45582284-9a575f80-b872-11e8-958c-330ac669b7ae.png)

Music was also something I meant to add.  Last years submission used OrgMaker (which is pretty good btw) and I wanted to try to use the &quot;better version&quot;, PxTone.   Toneplay was supposed to be a PxTone player using an almost number only format, similar to the model format.  I didn&#39;t like how PxTone worked and I switched back to OrgMaker, writing a tool to convert org files to the new format.  Sadly, the playing part never really got implemented, nor did any of the music.  I had one for the acid planet done but that was about it.  I was considering on the last day setting up one song to play during the whole game in something like miniMusic but I ran out of time to do that.

Anyway, that&#39;s about it.  Maybe next year now that I&#39;m a &quot;professional&quot; with my &quot;engine&quot;, I can make something a lot better than this year&#39;s.  It was a pretty stressful competition for me but hopefully next time I'll be more prepared :)