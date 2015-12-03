function Shelf (width, height, depth, name) {
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.name = name;
	this.color = 0x8b3626;

	this.books = [];

	this.frame = new THREE.Object3D();
	this.addInnerFrame();
}

Shelf.prototype.addInnerFrame = function () {
	this.innerFrame = new THREE.Object3D();

	var flat = this.makeFlatShelf();
	this.innerFrame.add(flat);

	this.frame.add(this.innerFrame);
}

Shelf.prototype.makeFlatShelf = function () {
	this.flatWidth = 1.1 * this.width;
	this.flatThickness = 0.2 * this.height;
	var flatFrame = new THREE.Object3D();
	flatFrame.name = this.name + 'FlatFrame';

	var flatGeom = new THREE.CubeGeometry(this.flatWidth, this.flatThickness, this.depth);
	var flatMat = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color});
	var flat = new THREE.Mesh(flatGeom, flatMat);
	flat.name = this.name + 'FlatMesh';

	flatFrame.add(flat);

	return flatFrame;
}

Shelf.prototype.clearBooks = function () {
	for (var i in this.books) {
		this.book.fall();
	}
	this.books = [];
}

Shelf.prototype.addBook = function (scene, objects, objectsControls) {
	var shelfPos = this.frame.position;
	var bookWidth = this.depth;
	var bookHeight = (Math.random() * 3 + 4) * this.flatThickness;
	var bookDepth = this.width/this.numBooks;
	var bookSpacing = 0.3 * bookDepth;
	var book = new Book(bookWidth, bookHeight, (Math.random() * 0.5 + 0.5) * (bookDepth - bookSpacing), Math.random() * 0xffffff, 'book' + this.books.length);
	var object = book.frame;
	object.position.copy(shelfPos);
	object.position.x -= 0.5 * this.width;
	object.position.x += (this.books.length + 0.5) * bookDepth;
	object.position.y += 0.5 * this.flatThickness + 0.5 * bookHeight;
	object.position.z += 0.5 * this.depth;
	object.rotateY(Math.PI/2);
	this.books.push(book);

	// leap object controls
  var objectControls = new THREE.LeapObjectControls(camera, object);

  objectControls.rotateEnabled  = true;
  objectControls.rotateSpeed    = 3;
  objectControls.rotateHands    = 1;
  objectControls.rotateFingers  = [2, 3];
  
  // *******Get rid of the scale function on objects******** 
  // *******Set objectControls.scaleEnabled = false
   objectControls.scaleEnabled   = false;
  objectControls.scaleSpeed     = 3;
  objectControls.scaleHands     = 1;
  objectControls.scaleFingers   = [4, 5];

  
  objectControls.panEnabled     = true;
  objectControls.panSpeed       = 3;
  objectControls.panHands       = 2;
  objectControls.panFingers     = [6, 12];
  objectControls.panRightHanded = false; // for left-handed person

  scene.add(object);
  objects.push(object);
  objectsControls.push(objectControls);
}

Shelf.prototype.addBooks = function (numBooks, scene, objects, objectsControls) {
	this.numBooks = numBooks;
	var shelfPos = this.frame.position;
	for (var i = 0; i < numBooks; i++) {
		this.addBook(scene, objects, objectsControls);
	}
}