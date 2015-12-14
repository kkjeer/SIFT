/*
Shelf constructor
Purpose: creates a new Shelf object with a frame containing a graphical model - a single box-shaped shelf
Parameters:
  width: width of the shelf (x-direction)
  height: height of the shelf (y-direction)
  depth: depth of the shelf (z-direction)
  name: name of the shelf (to distinguish separate Shelf objects)
*/
function Shelf (width, height, depth, name) {
  //from parameters
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.name = name;

  //predefined color
	this.color = 0x8b3626;

  //arrays to keep track of books on top of the shelf and on the floor, respectively
	this.books = [];
  this.floor = [];

  //whether or not the shelf is empty (has no books on it)
  this.shelfIsEmpty = false;

  //frame (graphical model)
	this.frame = new THREE.Object3D();
	this.addInnerFrame();
}

/*
addInnerFrame()
Purpose: adds the inner frame to the graphics frame
origin: center of shelf
extends along x-axis by 0.5 * this.width in each direction,
y-axis by 0.5 * this.height in each direction,
z-axis by 0.5 * this.depth in each direction
*/
Shelf.prototype.addInnerFrame = function () {
	this.innerFrame = new THREE.Object3D();

	var flat = this.makeFlatShelf();
	this.innerFrame.add(flat);

	this.frame.add(this.innerFrame);
}

/*
makeFlatShelf()
Purpose: returns a single flat box-shaped shelf
origin: center of shelf
extends along x-axis by 0.5 * this.width in each direction,
y-axis by 0.5 * this.height in each direction,
z-axis by 0.5 * this.depth in each direction
*/
Shelf.prototype.makeFlatShelf = function () {
	this.flatWidth = 1.1 * this.width;
	this.flatThickness = 0.2 * this.height;
	var flatFrame = new THREE.Object3D();
	flatFrame.name = this.name + 'FlatFrame';

	var flatGeom = new THREE.CubeGeometry(this.flatWidth, this.flatThickness, this.depth);
	var flatMat = new THREE.MeshPhongMaterial({color: this.color, ambient: this.color});
	//textured wood material - only if running on a server, cross-origin prevents running locally
	//flatMat = textureMaterial('wood');
	var flat = new THREE.Mesh(flatGeom, flatMat);
	flat.name = this.name + 'FlatMesh';

	flatFrame.add(flat);

	return flatFrame;
}

/*
range()
Purpose: returns an object containing the min and max x, y, and z coordinates of the shelf's frame
*/
Shelf.prototype.range = function () {
  var framePos = this.frame.position;
  var minX = framePos.x - 0.5 * this.width;
  var maxX = framePos.x + 0.5 * this.width;
  var minY = framePos.y - 0.5 * this.flatThickness;
  var maxY = framePos.y + 0.5 * this.flatThickness;
  var minZ = framePos.z - 0.5 * this.depth;
  var maxZ = framePos.z + 0.5 * this.depth;

  return {'minX': minX, 'maxX': maxX, 'minY': minY, 'maxY': maxY, 'minZ': minZ, 'maxZ': maxZ};
}

/*
addIntersectedBook()
Purpose: if the book at the given index intersects the shelf, as determined by their ranges,
         sets the book's position so it lines up nicely with the shelf,
         removes the book from the floor array, and adds the book to the books array
Parameters:
  bookIndex: index of the book to check
*/
Shelf.prototype.addIntersectedBook = function (bookIndex) {
  if (!this.intersectsBook(bookIndex)) {
    return;
  }

  var book = this.floor[bookIndex];
  var bookPos = book.frame.position;
  var shelfRange = this.range();

  //set the x coordinate
  var x = bookPos.x;
  if (x < shelfRange.minX) {
    x = shelfRange.minX;
  }
  if (x > shelfRange.minX) {
    x = shelfRange.maxX;
  }

  //set the y coordinate
  var y = shelfRange.minY + 0.5 * this.flatThickness + 0.5 * book.height;

  //set the z coordinate
  var z = shelfRange.minZ + 0.5 * this.depth + 0.5 * book.depth;

  //position, rotate and unhighlight the book
  book.frame.position.set(x, y, z);
  book.frame.rotation.y = Math.PI/2;
  book.unhighlight(); 

  //move the book from the floor to the books array
  this.floor[bookIndex] = undefined;
  this.books[bookIndex] = book;
}

/*
intersectsBook()
Purpose: returns true iff the book at the given index (in the floor array) intersects with the shelf's frame
         as determined by the ranges of the book and the shelf
Parameters:
  bookIndex: index of the book to check
*/
Shelf.prototype.intersectsBook = function (bookIndex) {
  var book = this.floor[bookIndex];
  if (!book) {
    return false;
  }

  //ranges of the shelf and book
  var shelfRange = this.range();
  var bookRange = book.range();

  //check the x
  var xTolerance = 1.0 * book.width;
  var xMinOkay = bookRange.minX >= shelfRange.minX - xTolerance && bookRange.minX <= shelfRange.maxX + xTolerance;
  var xMaxOkay = bookRange.maxX >= shelfRange.minX - xTolerance && bookRange.maxX <= shelfRange.maxX + xTolerance;
  var xOkay = xMinOkay || xMaxOkay;

  //check the y
  var yTolerance = 0.5 * book.height;
  var yMinOkay = bookRange.minY >= shelfRange.minY - yTolerance && bookRange.minY <= shelfRange.maxY + yTolerance;
  var yMaxOkay = bookRange.maxY >= shelfRange.minY - yTolerance && bookRange.maxY <= shelfRange.maxY + yTolerance;
  var yOkay = yMinOkay || yMaxOkay;

  //check the z
  var zTolerance = 0.5 * book.depth;
  var zMinOkay = bookRange.minZ >= shelfRange.minZ - zTolerance && bookRange.minZ <= shelfRange.maxZ + zTolerance;
  var zMaxOkay = bookRange.maxZ >= shelfRange.minZ - zTolerance && bookRange.maxZ <= shelfRange.maxZ + zTolerance;
  var zOkay = zMinOkay || zMaxOkay;

  return xOkay && yOkay && zOkay;
}

/*
clearBooks()
Purpose: make all the books on the shelf fall to the floor
*/
Shelf.prototype.clearBooks = function (objectsControls) {
    if(this.floor.length == 0){ //check if it's already registered a swipe gesture before
        this.floor = this.books; //floor gets all books
        
        for (var i in this.books) {
            var edgePos = new THREE.Vector3().copy(this.books[i].frame.position);
            var bookXSign = edgePos.x == 0 ? 0 : edgePos.x/Math.abs(edgePos.x);
            edgePos.z += this.depth;
            var sign = i % 2 == 0 ? 1 : -1;
            this.books[i].fall(edgePos, sign);
            //this.books[i].unhighlight(); //unhighlight when clearing the books from shelf
        }
        this.books = []; //empties books array
        this.shelfIsEmpty = true;
        
        var len = objectsControls.length;
        for(var i=0; i<len; i++){
            var oc = objectsControls.shift(); //pop the head of array, not tail
            oc.panEnabled = true;
            objectsControls.push(oc);
            
        }
        
        //update objectControls: enable pan when books fall from shelf.
        /*
        for(objectControls in objectsControls){
            console.log("pan before? " + objectControls.panEnabled);
            objectControls.panEnabled = true;
            console.log("pan after? " + objectControls.panEnabled);
        }
        */
        
        /*
        for(var i=0; i<objectsControls.length; i++){
            var objectControls = objectsControls.pop();
            console.log("before:" + objectControls.panEnabled);
            objectControls.panEnabled = true;
            objectsControls.push(objectControls);
            console.log("after:" + objectControls.panEnabled);
        }
        */
        //console.log("numbooks_floor:"+this.floor.length+",numbooks_shelf:"+this.books.length);
    }
}

/*
addBook()
Purpose: adds one book to the shelf, updating the objects and the objectsControls arrays in the process
*/
Shelf.prototype.addBook = function (scene, objects, objectsControls) {
	var shelfPos = this.frame.position;
	var bookWidth = this.depth;
	var bookHeight = randomInRange(1.25 * bookWidth, 2.0 * bookWidth);
	var bookDepth = this.width/this.numBooks;
	var bookSpacing = 0.3 * bookDepth;
	this.bookSpacing = bookSpacing;
	var book = new Book(bookWidth, bookHeight, randomInRange(0.5, 1) * (bookDepth - bookSpacing), Math.random() * 0xffffff, this.books.length);
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

  
  objectControls.panEnabled     = false; //books on the shelf should not be panned!!
  //console.log("disabled panning when adding book");
  objectControls.panSpeed       = 3;
  objectControls.panHands       = 2;
  objectControls.panFingers     = [6, 12];
  objectControls.panRightHanded = false; // for left-handed person

  scene.add(object);
  objects.push(object);
  objectsControls.push(objectControls);
}

/*
addBooks()
Purpose: adds numBooks books to the shelf
*/
Shelf.prototype.addBooks = function (numBooks, scene, objects, objectsControls) {
	this.numBooks = numBooks;
	var shelfPos = this.frame.position;
	for (var i = 0; i < numBooks; i++) {
		this.addBook(scene, objects, objectsControls);
	}
}