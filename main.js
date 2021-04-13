const mineflayer = require('mineflayer');
const vec3 = require('vec3');

var bossName = "Makkusu_Otaku"; //I'm the boss. >:D
var boss;

var blockList = [];

var mcData;

const bot = mineflayer.createBot({
	host: "localhost",
	username: "dreamwashuman",
});

bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn));
bot.on('error', err => console.log(err));

bot.once('spawn', ()=>{
	mcData = require('minecraft-data')(bot.version);
	boss = bot.players[bossName];
});

bot.on('chat', (username, message)=>{
	switch(message) {
		case 'house':
			let size = getHouseSize(6, 4);
			if (size > 2) {
				bot.chat(`Building house of size ${size}.`);
				createHouse(size, 4, 6);
			} else {
				bot.chat(`I need more blocks, size is ${size}.`);
			}
			break;
		case 'count':
			bot.chat(`Blocks: ${countBlocks()}`);
			break;
	}
});

bot.on('move', ()=>{
	boss = bot.players[bossName];

	if (!blockList.length) {
		bot.setControlState('forward', false);
		bot.setControlState('back', false);
		if (boss && boss.entity) bot.lookAt(boss.entity.position.offset(0, boss.entity.height, 0));
		return;
	}
	if (!bot.heldItem){
		let myStuff = blockItems();
		if (myStuff.length) bot.equip(myStuff[0], 'hand');
		return;
	}

	let position = blockList[0];
	let proximity = bot.entity.position.distanceTo(position);

	bot.lookAt(position);
	bot.setControlState('forward', proximity>3);
	bot.setControlState('back', proximity<2);

	if (proximity > 5 || proximity < 1) return;

	let referenceBlock = bot.blockAt(position);
	if (referenceBlock.name != 'air') {
		bot.dig(referenceBlock);
	} else {
		bot.placeBlock(referenceBlock, vec3(0, 1, 0), (error)=>console.log(error));
		blockList.shift();
	}
});

function blockItems() {
	return bot.inventory.slots.filter((slot)=>{
		return(slot && mcData.blocksByName[slot.name] && mcData.blocksByName[slot.name].boundingBox == 'block');
	});
}

function countBlocks() {
	let count = 0;

	for (slot of bot.inventory.slots) {
		if (slot && mcData.blocksByName[slot.name] && mcData.blocksByName[slot.name].boundingBox == 'block') {
			count += slot.count;
		}
	}
	return(count);
}

function getHouseSize(width, height) {
	let blockCount = countBlocks();
	let rowSize =  height*2+width-2;
	let remainingBlocks = blockCount-(width*height*2);
	return(Math.floor(remainingBlocks/rowSize)+2);
}

function createHouse(width, height, depth) {
  //Oh, this looks bad.
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			for (let z = 0; z < depth; z++) {
				if ((((x == 0 || x == width-1) || (z == 0 || z == depth-1)) && y < height) || y == height-1) {
					if (!(x == 0 && (z == 1 || z == 2) && y < 2)) blockList.push(bot.entity.position.offset(x-(width/2), y, z-(depth/2)));
				}
			}
		}
	}
}
