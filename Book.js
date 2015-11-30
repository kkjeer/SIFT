function Book (width, height, depth, color) {
	//properties from parameters
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.color = color;

	//page properties
	this.pageColor = 0xffefdb;
	this.numPages = 10;

	//frame
	this.frame = new THREE.Object3D();
	this.addInnerFrame();
}

//origin: center of left edge
//extends along x-axis by this.width,
//y-axis by 0.5 * this.height in each direction,
//z-axis by 0.5 * this.depth in each direction
Book.prototype.addInnerFrame = function () {
	this.innerFrame = new THREE.Object3D();

	var front = this.makeFrontCover();
	front.position.set(0, 0, 0.5 * this.depth);
	this.innerFrame.add(front);

	var back = this.makeBackCover();
	back.position.set(0, 0, -0.5 * this.depth);
	this.innerFrame.add(front);

	this.addPages();

	this.frame.add(this.innerFrame);
}

//origin: center of left edge
//extends along x and y axes
Book.prototype.makeFrontCover = function () {
	var frontCoverFrame = new THREE.Object3D();

	var frontGeom = new THREE.PlaneGeometry(this.width, this.height);
	var frontMat = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color});
	var front = new THREE.Mesh(frontGeom, frontMat);

	front.position.set(0.5 * this.width, 0, 0);
	frontCoverFrame.add(front);

	return frontCoverFrame;
}

//origin: center of left edge
//extends along x and y axes
Book.prototype.makeBackCover = function () {
	var backCoverFrame = new THREE.Object3D();

	var backGeom = new THREE.PlaneGeometry(this.width, this.height);
	var backMat = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color});
	var back = new THREE.Mesh(backGeom, backMat);

	back.position.set(0.5 * this.width, 0, 0);
	backCoverFrame.add(back);

	return backCoverFrame;
}

Book.prototype.makeSpine = function () {
	var spineFrame = new THREE.Object3D();

	return spineFrame;
}

Book.prototype.addPages = function () {
	var pageFrame = this.makePage();
	var pageDistance = this.depth/this.numPages;

	for (var i = 0; i < this.numPages; i++) {
		var page = pageFrame.clone();
		page.position.set(0, 0, i * pageDistance - 0.5 * this.depth);
		this.innerFrame.add(page);
	}
}

//origin: center of left edge
//extends along x and y axes
Book.prototype.makePage = function () {
	var pageFrame = new THREE.Object3D();

	var pageGeom = new THREE.PlaneGeometry(this.width, this.height);
	var pageMat = new THREE.MeshPhongMaterial({color: this.pageColor, ambient: this.pageColor});
	var page = new THREE.Mesh(pageGeom, pageMat);

	page.position.set(0.5 * this.width, 0, 0);
	pageFrame.add(page);

	return pageFrame;
}

Book.prototype.flipPages = function () {

}