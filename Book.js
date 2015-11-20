function Book (width, height, depth) {
	this.width = width;
	this.height = height;
	this.depth = depth;

	this.frame = new THREE.Object3D();
}

Book.prototype.makeFrontCover = function () {
	var frontCoverFrame = new THREE.Object3D();

	return frontCoverFrame;
}

Book.prototype.makeBackCover = function () {
	var backCoverFrame = new THREE.Object3D();

	return backCoverFrame;
}

Book.prototype.makeSpine = function () {
	var spineFrame = new THREE.Object3D();

	return spineFrame;
}

Book.prototype.addPages = function () {
	
}

Book.prototype.makePage = function () {
	var pageFrame = new THREE.Object3D();

	return pageFrame;
}

Book.prototype.flipPages = function () {

}