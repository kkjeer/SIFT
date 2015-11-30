// ================================================================
// Bezier Surfaces; additions to THREE.js

/**
 * @author Scott D. Anderson
 */

THREE.BezierSurfaceGeometry = function( controlPoints, sSegments, tSegments) {

    THREE.Geometry.call( this );

    this.type = 'BezierSurfaceGeometry';

    this.parameters = { controlPoints: controlPoints,
                        sSegments: sSegments,
                        tSegments: tSegments };

    this.controlPoints = controlPoints;
    this.sSegments = sSegments;
    this.tSegments = tSegments;

    this.computeBezierSurfacePoints();
    this.computeBezierSurfaceFaces();
    this.computeFaceNormals();
    this.computeVertexNormals();
};

/* I was going to have this inherit from THREE.PlaneGeometry, but there's
 * nothing useful to inherit, so I'll make it inherit from
 * Geometry. Actually, I'll just define a prototype. */

THREE.BezierSurfaceGeometry.prototype = Object.create( THREE.Geometry.prototype );


/**
 * @author Scott D. Anderson
 */

THREE.BezierSurfaceGeometry.prototype.computeBezierSurfacePoints =
    function () {
    var sSegments = this.sSegments;
    var tSegments = this.tSegments;
    var cps = this.controlPoints;

    var sInt, tInt; // the integer values correlating to s and t
    var s, t, verts = [];

    // First, compute all the vertices
    for( tInt = 0, t = 0; tInt <= tSegments; tInt++ ) {
        t = tInt/tSegments;
        for( sInt = 0; sInt <= sSegments; sInt++ ) {
            s = sInt/sSegments;
            // calculate blending functions (weights) for current point
            verts.push( bez(s, t) );
        }
    }
    this.vertices = verts;
    return verts;

    // the rest is all supporting functions

    function bez(s,t) {
        // this computes and returns a vertex at (s,t)
        // the code follows exactly the definition of a degree(3,3) bezier surface
        // see, for example, http://en.wikipedia.org/wiki/BÃ©zier_surface
        var i, j, M = 3, N = 3;
        var vert = new THREE.Vector3(0,0,0);  // initialize sums to zero
        for( i=0; i<=N; i++ ) {
            for( j=0; j<=M; j++ ) {
                var bernNIS = bernstein(N,i,s);
                var bernMJT = bernstein(M,j,t);
                var cp = cps[j][i];
                vert.x += cp[0] * bernNIS * bernMJT;
                // console.log("i: "+i+" j: "+j+" bernNIS: "+bernNIS+" bernMJT: "+bernMJT+" cp: "+cp[0]+" dx: "+(cp[0]*bernNIS*bernMJT)+" x: "+vert.x);

                vert.y += cp[1] * bernNIS * bernMJT;
                vert.z += cp[2] * bernNIS * bernMJT;
            }
        }
        return vert;
    }

    function bernstein(n,i,u) {
        // This is not the general Bernstein polynomial. We ignore n
        // and assume it's always 3.
        switch (i) {
        case 0: return (1-u)*(1-u)*(1-u);
        case 1: return 3*u*(1-u)*(1-u);
        case 2: return 3*u*u*(1-u);
        case 3: return u*u*u;
        }
    }

};

/**
 * @author Scott D. Anderson
 */

THREE.BezierSurfaceGeometry.prototype.computeBezierSurfaceFaces =
    function () {
    var sSegments = this.sSegments;
    var tSegments = this.tSegments;
    // perhaps unsurprisingly, we don't need to know the vertices; we just
    // need to generate indices into the vertex array.

    // This code is based in part on the code for THREE.PlaneGeometry from R67
    // However, that code goes top to bottom, and I want to go bottom to top,
    // so I had to change the face indices so that the faces were still CCW from the front        

    // x corresponds to s and z to t
    var ix, iz;

    var gridX = sSegments;
    var gridZ = tSegments;

    var gridX1 = gridX + 1;
    var gridZ1 = gridZ + 1;

    for ( iz = 0; iz < gridZ; iz ++ ) {

        for ( ix = 0; ix < gridX; ix ++ ) {

            var a = ix + gridX1 * iz;
            var b = ix + gridX1 * ( iz + 1 );
            var c = ( ix + 1 ) + gridX1 * ( iz + 1 );
            var d = ( ix + 1 ) + gridX1 * iz;

            var uva = new THREE.Vector2( ix / gridX, 1 - iz / gridZ );
            var uvb = new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ );
            var uvc = new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ );
            var uvd = new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ );

            var face = new THREE.Face3( a, c, b );

            this.faces.push( face );
            this.faceVertexUvs[ 0 ].push( [ uva, uvb, uvd ] );

            face = new THREE.Face3( a, d, c );

            this.faces.push( face );
            this.faceVertexUvs[ 0 ].push( [ uvb.clone(), uvc, uvd.clone() ] );
        }
    }
};