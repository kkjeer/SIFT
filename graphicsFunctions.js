var IMAGE_PATH = 'images/';
var IMAGE_FORMAT = '.png';

function textureMaterial (img) {
  //load the texture from the given image
  var texture = new THREE.ImageUtils.loadTexture(IMAGE_PATH + img + IMAGE_FORMAT, new THREE.UVMapping());
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.needsUpdate = true;

  //create and return the material
  var mat = new THREE.MeshPhongMaterial({color: 0xffffff, ambient: 0xffffff, side: THREE.DoubleSide});
  mat.map = texture;
  return mat;
}

function randomInRange (min, max) {
  return Math.random() * (max - min) + min;
}

function randomSign () {
	return Math.random() < 0.5 ? -1 : 1;
}