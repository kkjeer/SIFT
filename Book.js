/*
Book constructor
Purpose: creates a new Book object with a frame containing the graphical model
Parameters:
	width: width of the book cover
	height: height of the book cover
	depth: width of the book spine (distance between front and back covers)
	index: index of the book in a Shelf array (see Shelf.js)
*/
function Book (width, height, depth, color, index) {
	//properties from parameters
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.color = color;
	this.name = 'book' + index;
	this.index = index;

	//animation properties: pulling off and on the shelf
	this.isOut = false;
	this.inOutDistance = 0.6 * this.width;
	this.inOutTime = 700;

	//animation properties: falling to the floor
	this.mass = 0.004 * this.height * this.width * this.depth;
	this.speed = 50000/this.mass;

	//page properties
	this.pageColor = 0xffefdb;
	this.pageWidth = 0.9 * this.width;
	this.numPages = 10;

	//frame (graphical model)
	this.frame = new THREE.Object3D();
	this.frame.name = this.name;
	this.addInnerFrame();
}

/*
range()
Purpose: returns an object containing the min and max x, y, and z coordinates of the book's frame
*/
Book.prototype.range = function () {
	var framePos = this.frame.position;
	var frameRot = this.frame.rotation;
	var minX = framePos.x - 0.0 * this.width;
	var maxX = framePos.x + 1.0 * this.width;
  var minY = framePos.y - 0.5 * this.height;
  var maxY = framePos.y + 0.5 * this.height;
  var minZ = framePos.z - 0.5 * this.depth;
  var maxZ = framePos.z + 0.5 * this.depth;

  return {'minX': minX, 'maxX': maxX, 'minY': minY, 'maxY': maxY, 'minZ': minZ, 'maxZ': maxZ};
}

/*
pullOut()
Purpose: animates the book in the positive z-direction (off of the shelf)
*/
Book.prototype.pullOut = function () {
	if (this.isOut) {
		return;
	}

	this.stopMoving();

	var book = this;
	var outPos = {x: this.frame.position.x, y: this.frame.position.y, z: this.frame.position.z + this.inOutDistance};
	book.pullTween = new TWEEN.Tween(book.frame.position).to(outPos, book.inOutTime).onComplete(function () {
		book.isOut = true;
	}).start();
}

/*
pushIn()
Purpose: animates the book in the negative z-direction (onto the shelf)
*/
Book.prototype.pushIn = function () {
	if (!this.isOut) {
		return;
	}

	this.stopMoving();

	var book = this;
	var inPos = {x: this.frame.position.x, y: this.frame.position.y, z: this.frame.position.z - this.inOutDistance};
	book.pushTween = new TWEEN.Tween(book.frame.position).to(inPos, book.inOutTime).onComplete(function () {
		book.isOut = false;
	}).start();
}

/*
open()
Purpose: animates the book in the positive z-direction, while animating its pages and covers open
Parameters:
	yPosition: y-coordinate of the book's final position
	callback: optional callback function, to be run once the animation is complete
*/
Book.prototype.open = function (yPosition, callback) {
	//stop all current motion
	this.stopMoving();

	//define helpful variables
	var book = this;
	book.openTime = 2000;
	var maxYRotation = 0.9 * Math.PI/2;

	//rotate the book to face forward
	book.openRotateTween = new TWEEN.Tween(book.frame.rotation).to({y: -Math.PI/2}, book.openTime);

	//rotate the front and back covers to open
	book.openFrontTween = new TWEEN.Tween(book.front.rotation).to({y: -maxYRotation}, book.openTime);
	book.openBackTween = new TWEEN.Tween(book.back.rotation).to({y: maxYRotation}, book.openTime);

	//rotate each page
	book.openPageTweens = [];
	var midpoint = Math.floor(book.pages.length/2);
	var pageRotation = maxYRotation/midpoint;
	book.pages.forEach(function (page, index) {
		var sign = index < midpoint ? -1 : 1;
		var distance = Math.abs(midpoint - index);
		var rot = distance * sign * pageRotation;
		book.openPageTweens.push(new TWEEN.Tween(page.rotation).to({y: rot}, book.openTime));
	});

	//move the book forward, starting all rotations at the same time
	var openPos = {x: 0, y: yPosition + 0.5 * this.height, z: 100};
	book.openTween = new TWEEN.Tween(book.frame.position).to(openPos, book.openTime).onStart(function () {
		book.openRotateTween.start();
		book.openFrontTween.start();
		book.openBackTween.start();
		for (var i in book.openPageTweens) {
			book.openPageTweens[i].start();
		}
	}).onComplete(function () {
		if (callback) {
			callback();
		}
	}).start();
}

/*
close()
Purpose: resets the covers and pages to their initial rotation (no animation)
*/
Book.prototype.close = function () {
	this.front.rotation.y = 0;
	this.back.rotation.y = 0;
	for (var i in this.pages) {
		this.pages[i].rotation = y;
	}
}

/*
fall()
Purpose: animates the book off the shelf and onto the floor
Parameters:
	shelfEdgePos: vector on the edge of the shelf, point at which the book begins falling to the floor
	rotationSign: 1 or -1, determines where on the floor the book falls
*/
Book.prototype.fall = function (shelfEdgePos, rotationSign) {
	this.stopMoving();
	var book = this;

	//tween to move the book to the edge of the shelf
	var edgeTime = 1000 * new THREE.Vector3().subVectors(book.frame.position, shelfEdgePos).length()/book.speed;
	book.toEdgeTween = new TWEEN.Tween(book.frame.position).to(shelfEdgePos, edgeTime);

	//determine the position on the floor that the book falls to
	var floorPos = new THREE.Vector3().copy(shelfEdgePos);
	floorPos.x *= randomInRange(1.0, 1.5);
	floorPos.y -= floorPos.y;
	floorPos.z *= rotationSign == 1 ? randomInRange(1.8, 2.0) : randomInRange(1.0, 1.2);
	var floorTime = 1000 * new THREE.Vector3().subVectors(book.frame.position, shelfEdgePos).length()/book.speed;

	//define rotation ranges while falling to the floor
	book.floorXRotation = randomInRange(-Math.PI/4, Math.PI/4);
	book.floorYRotation = randomInRange(-Math.PI/2, Math.PI/2);
	book.floorZRotation = randomInRange(-Math.PI/3, Math.PI/3);
	
	//tween to move the book to the floor
	book.toFloorTween = new TWEEN.Tween(book.frame.position).to(floorPos, floorTime).onUpdate(function () {
		book.frame.rotateX(20 * book.floorXRotation/floorTime);
		book.frame.rotateY(20 * book.floorYRotation/floorTime);
		book.frame.rotateZ(20 * book.floorXRotation/floorTime);
	});

	//first move the book to the edge, then move it to the floor
	book.toEdgeTween.onComplete(function () {
		book.toFloorTween.start();
	}).start();
}

/*
stopMoving()
Purpose: stops all animations associated with the book
*/
Book.prototype.stopMoving = function () {
	if (this.pullTween) {
		this.pullTween.stop();
	}
	if (this.pushTween) {
		this.pullTween.stop();
	}
	if (this.toEdgeTween) {
		this.toEdgeTween.stop();
	}
	if (this.toFloorTween) {
		this.toFloorTween.stop();
	}
}

/*
addInnerFrame()
Purpose: adds the inner frame to the graphics frame
				 the inner frame contains the covers, spine and pages
origin: center of left edge
extends along x-axis by this.width,
y-axis by 0.5 * this.height in each direction,
z-axis by 0.5 * this.depth in each direction
*/
Book.prototype.addInnerFrame = function () {
	this.innerFrame = new THREE.Object3D();
	this.innerFrame.name = this.name + '#InnnerFrame';

	this.front = this.makeFrontCover();
	this.front.position.set(0, 0, 0.5 * this.depth);
	this.innerFrame.add(this.front);

	this.back = this.makeBackCover();
	this.back.position.set(0, 0, -0.5 * this.depth);
	this.innerFrame.add(this.back);

	var spine = this.makeSpine();
	spine.rotateY(-Math.PI/2);
	this.innerFrame.add(spine);

	this.addPages();

	this.frame.add(this.innerFrame);
}

/*
makeFrontCover()
Purpose: returns a frame containing a planar cover
				 separate from makeBackCover() in case of further graphical detail (title, cover image, etc.)
origin: center of left edge
extends along x and y axes
*/
Book.prototype.makeFrontCover = function () {
	var frontCoverFrame = new THREE.Object3D();
	frontCoverFrame.name = this.name + '#FrontCoverFrame';

	var frontGeom = new THREE.PlaneGeometry(this.width, this.height);
	var frontMat = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color, side: THREE.DoubleSide});
	this.frontMesh = new THREE.Mesh(frontGeom, frontMat);
	this.frontMesh.name = this.name + '#FrontCoverMesh';

	this.frontMesh.position.set(0.5 * this.width, 0, 0);
	frontCoverFrame.add(this.frontMesh);

	return frontCoverFrame;
}

/*
makeBackCover()
Purpose: returns a frame containing a planar cover
				 separate from makeFronCover() in case of further graphical detail (title, cover image, etc.)
origin: center of left edge
extends along x and y axes
*/
Book.prototype.makeBackCover = function () {
	var backCoverFrame = new THREE.Object3D();
	backCoverFrame.name = this.name + '#BackCoverFrame';

	var backGeom = new THREE.PlaneGeometry(this.width, this.height);
	var backMat = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color, side: THREE.DoubleSide});
	this.backMesh = new THREE.Mesh(backGeom, backMat);
	this.backMesh.name = this.name + '#BackCoverMesh';

	this.backMesh.position.set(0.5 * this.width, 0, 0);
	backCoverFrame.add(this.backMesh);

	return backCoverFrame;
}

/*
makeSpine()
Purpose: returns a frame containing a spine made from a Bezier surface
origin: bottom left corner
extends along position x and y axes, curves in positive z-direction
*/
Book.prototype.makeSpine = function () {
	this.spineCurvature = 0.75 * this.depth;
	var spineFrame = new THREE.Object3D();
	spineFrame.name = this.name + '#SpineFrame';

	var spinePoints = [
		[
			[0, 0, 0],
			[0.25 * this.depth, 0, 0.5 * this.spineCurvature],
			[0.75 * this.depth, 0, 0.5 * this.spineCurvature],
			[this.depth, 0, 0]
		],
		[
			[0, 0.25 * this.height, 0],
			[0.25 * this.depth, 0.25 * this.height, 0.5 * this.spineCurvature],
			[0.75 * this.depth, 0.25 * this.height, 0.5 * this.spineCurvature],
			[this.depth, 0.25 * this.height, 0]
		],
		[
			[0, 0, 0],
			[0.25 * this.depth, 0.75 * this.height, 0.5 * this.spineCurvature],
			[0.75 * this.depth, 0.75 * this.height, 0.5 * this.spineCurvature],
			[this.depth, 0.75 * this.height, 0]
		],
		[
			[0, this.height, 0],
			[0.25 * this.depth, this.height, 0.5 * this.spineCurvature],
			[0.75 * this.depth, this.height, 0.5 * this.spineCurvature],
			[this.depth, this.height, 0]
		]
	];
	var spineGeom = new THREE.BezierSurfaceGeometry(spinePoints, 20, 20);
	var spineMat = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color, side: THREE.DoubleSide});
	this.spineMesh = new THREE.Mesh(spineGeom, spineMat);
	this.spineMesh.name = this.name + '#SpineMesh';

	this.spineMesh.position.set(-0.5 * this.depth, -0.5 * this.height, 0);
	spineFrame.add(this.spineMesh);

	return spineFrame;
}

/*
addPages()
Purpose: adds this.numPages page frames to the innerFrame, spaced evenly apart
*/
Book.prototype.addPages = function () {
	this.pages = [];
	var pageFrame = this.makePage();
	var pageDistance = this.depth/this.numPages;

	for (var i = 1; i < this.numPages; i++) {
		var page = pageFrame.clone();
		page.position.set(0, 0, i * pageDistance - 0.5 * this.depth);
		this.innerFrame.add(page);
		this.pages.push(page);
	}
}

/*
makePage()
Purpose: returns a frame containing a thin box-shaped page
origin: center of left edge
extends along x and y axes
*/
Book.prototype.makePage = function () {
	var pageFrame = new THREE.Object3D();
	pageFrame.name = this.name + '#PageFrame';

	var pageGeom = new THREE.CubeGeometry(this.pageWidth, this.height, 0.005 * this.depth);
	var pageMat = new THREE.MeshPhongMaterial({color: this.pageColor, ambient: this.pageColor});
	var page = new THREE.Mesh(pageGeom, pageMat);
	page.name = this.name + '#PageMesh';

	page.position.set(0.5 * this.pageWidth, 0, 0);
	pageFrame.add(page);

	return pageFrame;
}

/*
highlight()
Purpose: colors the covers and spine materials with this.highlightColor
*/
Book.prototype.highlight = function () {
	this.highlightColor = 0xffff00;
	this.frontMesh.material.emissive.setHex(this.highlightColor);
	this.backMesh.material.emissive.setHex(this.highlightColor);
	this.spineMesh.material.emissive.setHex(this.highlightColor);
}

/*
unhighlight()
Purpose: resets the covers and spine materials to their original color
*/
Book.prototype.unhighlight = function () {
	this.unhighlightColor = 0x000000;
	this.frontMesh.material.emissive.setHex(this.unhighlightColor);
	this.backMesh.material.emissive.setHex(this.unhighlightColor);
	this.spineMesh.material.emissive.setHex(this.unhighlightColor);
}