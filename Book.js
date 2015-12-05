function Book (width, height, depth, color, name) {
	//properties from parameters
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.color = color;
	this.name = name;

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

	//frame
	this.frame = new THREE.Object3D();
	this.frame.name = this.name;
	this.addInnerFrame();
}

Book.prototype.pullOut = function () {
	if (this.isOut) {
		return;
	}

	var book = this;
	var outPos = {x: this.frame.position.x, y: this.frame.position.y, z: this.frame.position.z + this.inOutDistance};
	book.pullTween = new TWEEN.Tween(book.frame.position).to(outPos, book.inOutTime).onComplete(function () {
		book.isOut = true;
	}).start();
}

Book.prototype.pushIn = function () {
	if (!this.isOut) {
		return;
	}

	var book = this;
	var inPos = {x: this.frame.position.x, y: this.frame.position.y, z: this.frame.position.z - this.inOutDistance};
	book.pushTween = new TWEEN.Tween(book.frame.position).to(inPos, book.inOutTime).onComplete(function () {
		book.isOut = false;
	}).start();
}

Book.prototype.fall = function (shelfEdgePos, rotationSign) {
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

//origin: center of left edge
//extends along x-axis by this.width,
//y-axis by 0.5 * this.height in each direction,
//z-axis by 0.5 * this.depth in each direction
Book.prototype.addInnerFrame = function () {
	this.innerFrame = new THREE.Object3D();
	this.innerFrame.name = this.name + 'InnnerFrame';

	var front = this.makeFrontCover();
	front.position.set(0, 0, 0.5 * this.depth);
	this.innerFrame.add(front);

	var back = this.makeBackCover();
	back.position.set(0, 0, -0.5 * this.depth);
	this.innerFrame.add(back);

	var spine = this.makeSpine();
	spine.rotateY(-Math.PI/2);
	this.innerFrame.add(spine);

	this.addPages();

	this.frame.add(this.innerFrame);
}

//origin: center of left edge
//extends along x and y axes
Book.prototype.makeFrontCover = function () {
	var frontCoverFrame = new THREE.Object3D();
	frontCoverFrame.name = this.name + 'FrontCoverFrame';

	var frontGeom = new THREE.PlaneGeometry(this.width, this.height);
	var frontMat = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color, side: THREE.DoubleSide});
	this.front = new THREE.Mesh(frontGeom, frontMat);
	this.front.name = this.name + 'FrontCoverMesh';

	this.front.position.set(0.5 * this.width, 0, 0);
	frontCoverFrame.add(this.front);

	return frontCoverFrame;
}

//origin: center of left edge
//extends along x and y axes
Book.prototype.makeBackCover = function () {
	var backCoverFrame = new THREE.Object3D();
	backCoverFrame.name = this.name + 'BackCoverFrame';

	var backGeom = new THREE.PlaneGeometry(this.width, this.height);
	var backMat = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color, side: THREE.DoubleSide});
	this.back = new THREE.Mesh(backGeom, backMat);
	this.back.name = this.name + 'BackCoverMesh';

	this.back.position.set(0.5 * this.width, 0, 0);
	backCoverFrame.add(this.back);

	return backCoverFrame;
}

//origin: bottom left corner
//extends along position x and y axes, curves in positive z-direction
Book.prototype.makeSpine = function () {
	this.spineCurvature = 0.75 * this.depth;
	var spineFrame = new THREE.Object3D();
	spineFrame.name = this.name + 'SpineFrame';

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
	this.spine = new THREE.Mesh(spineGeom, spineMat);
	this.spine.name = this.name + 'SpineMesh';

	this.spine.position.set(-0.5 * this.depth, -0.5 * this.height, 0);
	spineFrame.add(this.spine);

	return spineFrame;
}

Book.prototype.addPages = function () {
	var pageFrame = this.makePage();
	var pageDistance = this.depth/this.numPages;

	for (var i = 1; i < this.numPages; i++) {
		var page = pageFrame.clone();
		page.position.set(0, 0, i * pageDistance - 0.5 * this.depth);
		this.innerFrame.add(page);
	}
}

//origin: center of left edge
//extends along x and y axes
Book.prototype.makePage = function () {
	var pageFrame = new THREE.Object3D();
	pageFrame.name = this.name + 'PageFrame';

	var pageGeom = new THREE.CubeGeometry(this.pageWidth, this.height, 0.005 * this.depth);
	var pageMat = new THREE.MeshPhongMaterial({color: this.pageColor, ambient: this.pageColor});
	var page = new THREE.Mesh(pageGeom, pageMat);
	page.name = this.name + 'PageMesh';

	page.position.set(0.5 * this.pageWidth, 0, 0);
	pageFrame.add(page);

	return pageFrame;
}

Book.prototype.highlight = function () {
	this.highlightColor = 0xffff00;
	this.front.material.emissive.setHex(this.highlightColor);
	this.back.material.emissive.setHex(this.highlightColor);
	this.spine.material.emissive.setHex(this.highlightColor);
}

Book.prototype.unhighlight = function () {
	this.unhighlightColor = 0x000000;
	this.front.material.emissive.setHex(this.unhighlightColor);
	this.back.material.emissive.setHex(this.unhighlightColor);
	this.spine.material.emissive.setHex(this.unhighlightColor);
}