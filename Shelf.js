function Shelf (width, height, depth, name) {
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.name = name;
	this.color = 0x8b3626;

	this.books = [];
    this.floor = [];
    this.shelfIsEmpty = false;

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
	//textured wood material - only if running on a server, cross-origin prevents running locally
	//flatMat = textureMaterial('wood');
	var flat = new THREE.Mesh(flatGeom, flatMat);
	flat.name = this.name + 'FlatMesh';

	flatFrame.add(flat);

	return flatFrame;
}

Shelf.prototype.clearBooks = function (objectsControls) {
    if(this.floor.length == 0){ //check if it's already registered a swipe gesture before
        this.floor = this.books; //floor gets all books
        
        for (var i in this.books) {
            var edgePos = new THREE.Vector3().copy(this.books[i].frame.position);
            var bookXSign = edgePos.x == 0 ? 0 : edgePos.x/Math.abs(edgePos.x);
            //edgePos.x += bookXSign * i * this.bookSpacing;
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

Shelf.prototype.addBook = function (scene, objects, objectsControls) {
	var shelfPos = this.frame.position;
	var bookWidth = this.depth;
	var bookHeight = randomInRange(1.25 * bookWidth, 2.0 * bookWidth);
	var bookDepth = this.width/this.numBooks;
	var bookSpacing = 0.3 * bookDepth;
	this.bookSpacing = bookSpacing;
	var book = new Book(bookWidth, bookHeight, randomInRange(0.5, 1) * (bookDepth - bookSpacing), Math.random() * 0xffffff, 'book' + this.books.length);
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

Shelf.prototype.addBooks = function (numBooks, scene, objects, objectsControls) {
	this.numBooks = numBooks;
	var shelfPos = this.frame.position;
	for (var i = 0; i < numBooks; i++) {
		this.addBook(scene, objects, objectsControls);
	}
}