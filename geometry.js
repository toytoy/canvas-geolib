// take an x and y from the source coordinate system to the canvas coordinate system
function transformCoords(x, y){
  var width = 800;
  var height = 600;
  var result = new Vector(x, height - y);
  return result;
}

function Vector(x, y){
  this.x = x;
  this.y = y;
  this.color = '#000';
  this.size = 5;
  this.draw = function(canvas) {
    var context = canvas.getContext('2d');
    context.fillStyle = this.color; //black    
    var tthis = transformCoords(x, y);
    context.fillRect(tthis.x - this.size/2, tthis.y - this.size/2, this.size, this.size);

  };
  this.scalarMult = function(scalar){
	  return new Vector(this.x * scalar, this.y * scalar);
  };
  this.dot = function(v2) {
    return this.x * v2.x + this.y * v2.y;
  };
  this.perp = function() {
    return new Vector(-1 * this.y, this.x);
  };
  this.subtract = function(v2) {
    return this.add(v2.scalarMult(-1));//new Vector(this.x - v2.x, this.y - v2.y);
  };
  this.add = function(v2) {
	  return new Vector(this.x + v2.x, this.y + v2.y);
  };
}

function Segment(p1, p2){
  this.p1 = p1;
  this.p2 = p2;
  this.color = '#000'; //black
  this.draw = function(canvas) {
    var context = canvas.getContext('2d');
    context.strokeStyle = this.color; //black
    context.lineWidth = 4;
    //alert('s4');
    context.beginPath();
    var tp1 = transformCoords(p1.x, p1.y);
    var tp2 = transformCoords(p2.x, p2.y);
    context.moveTo(tp1.x, tp1.y);
    context.lineTo(tp2.x, tp2.y);
    //alert('s5');
    context.closePath();
    context.stroke();
    //alert('s6');
  };

}

// the cross product of vectors v1 and v2.
function cross(v1, v2) {
	return v1.x * v2.y - v2.x * v1.y;
}

//
//determines if the 3 points, p1, p2, p3 form a strictly right turn (i.e. they can't be collinear)
//
function rightTurn(p1, p2, p3)
{
	var v1 = p2.subtract(p1);
	var v2 = p3.subtract(p2);
	//returns true of the vector from p2 to p3 is a right turn compared to the vector from p1 to p2.
	if(cross(v1, v2) < 0){
		return true;
	}
	return false;
}



//
//determines if the 3 points, p1, p2, p3 form a strictly left turn (i.e. they can't be collinear)
//
function leftTurn(p1, p2, p3){
	var v1 = p2.subtract(p1);
	var v2 = p3.subtract(p2);
	//returns true of the vector from p2 to p3 is a left turn compared to the vector from p1 to p2.
	if(cross(v1, v2) > 0){
		return true;
	}
	return false;
}

/*
	seg1 is represented by p + t * r where  0 <= t <= 1
	seg2 is represented by q + u * s where  0 <= u <= 1

	the intersection of line 1 and line 2 is given by
	p + t*r = q + u*s,
	let x be the two dimensional cross product then
	(p + t*r) x s = (q + u*s) x s = q x s
	which solving for t gives
	t = (q - p) x s / (r x s).
	similarly solving for u gives
	u = (q - p) x r / (r x s).
	the segments intersect if 0 <= t <= 1 and 0 <= 1 <= u.
	If r x s is zero then the lines are parallel, in which case if
	(q - p) x r = 0 then the lines are co-linear.

*/

//determine if segments [x1, x2] and [x3, x4] intersect
function intersect1d(x1, x2, x3, x4){
	if((x2 >= x3 || x2 >= x4) && (x1 <= x3 || x1 <= x4)){
		return 1;
	}
	return 0;
}

var epsilon = 10e-6;
var DONT_INTERSECT = 0;
var PARALLEL_DONT_INTERSECT = 1;
var COLLINEAR_DONT_INTERSECT = 2;
var INTERSECT = 3;
var COLLINEAR_INTERSECT = 4;
function intersect(seg1, seg2, intersectionPoint) {
	p = seg1.p1;
	r = seg1.p2.subtract(seg1.p1);
	q = seg2.p1;
	s = seg2.p2.subtract(seg2.p1);
	rCrossS = cross(r, s);
	// line segments are parallel
	if(rCrossS <= epsilon && rCrossS >= -1 * epsilon){
		// line segments are collinear
		if(cross(q.subtract(p), s) <= epsilon && cross(q.subtrac(p), s) >= -1 * epsilon){
			if(intersect1d(seg1.p1.x, seg1.p2.x, seg2.p1.x, seg2.p2.x) == 1){
				return COLLINEAR_INTERSECT;
			}else{
				return COLLINEAR_DONT_INTERSECT;
			}
		}
		return PARALLEL_DONT_INTERSECT;
	}
	t = cross(q.subtract(p), s)/rCrossS;
	u = cross(q.subtract(p), r)/rCrossS;
	if(0 <= u && u <= 1 && 0 <= t && t <= 1){
		intPoint = p.add(r.scalarMult(t));
		intersectionPoint.x = intPoint.x;
		intersectionPoint.y = intPoint.y;
		return INTERSECT;
	}else{
		return DONT_INTERSECT;
	}
}


//
// returns the set of points that determine the convex hull of "points", points must be an array of Vectors
//
function convexHull(points) {
  points.sort(sortByX);

  // Lupper is the set of points for the upper half of the convex hull
  var Lupper = new Array();
  Lupper.push(points[0]);
  Lupper.push(points[1]);
  var n = points.length;
  for(var i = 2; i < n; i = i + 1){
    
    Lupper.push(points[i]);
    var lN = Lupper.length;
    // if Lupper has more than two points and the last three points do not make a right turn then remove the middle point
    while(lN > 2 && !rightTurn(Lupper[lN - 3], Lupper[lN - 2], Lupper[lN - 1])) {
	    //alert('c23 i:' + i);
	    var pn = Lupper.pop();
	    var pn1 = Lupper.pop();
	    var pn2 = Lupper.pop();
	    Lupper.push(pn2);
	    Lupper.push(pn);
	    lN = Lupper.length;
    }
  }
  // Llower is the set of points for the lower half of the convex hull
  var Llower = new Array();
  Llower.push(points[n-1]);
  Llower.push(points[n-2]);
  for(var i = n - 3; i >= 0; i = i - 1){
    Llower.push(points[i]);
    var lN = Llower.length;
    // if Llower has more than two points and the last three points do not make a right turn then remove the middle point
    while(lN > 2 && !rightTurn(Llower[lN - 3], Llower[lN - 2], Llower[lN - 1])) {

      var pn = Llower.pop();
      var pn1 = Llower.pop();
      var pn2 = Llower.pop();
      Llower.push(pn2);
      Llower.push(pn);
      lN = Llower.length;
    }
  }

  //remove the first and last point of Llower to avoid duplication of the points where the upper and lower hull meet
  Llower.shift();
  Llower.pop();

  // append the lower hull to the upper hull.
  for(var i = 0; i < Llower.length; i = i + 1){
    Lupper.push(Llower[i]);
  }
  // return the completed hull
  return Lupper;

}

// compares two vectors, p1 and p2, by their x coordinate
function sortByX(p1, p2) {
  return p1.x - p2.x;
}

// computes the smallest enclosing disk a set of points
function enclosingDisk(points){
    var disk = [[0, 0], 0];
    if (points.length < 2){
	return null;
    } 

    disk = enclosingDisk2Points(points[0], points[1]);
    for (var i = 2; i < points.length; i++) {
	if (inDisk(disk, points[i])) {
	    continue;
	}
	disk = enclosingDiskWithBoundaryPoint(points, i, points[i]);
    }
    return disk;
}

function enclosingDiskWithBoundaryPoint(points, i, p_i){
    var disk = enclosingDisk2Points(points[0], p_i);
    for (var j = 1; j < i; j++) {
	if (inDisk(disk, points[j])){
	    continue;
	}
	disk = enclosingDiskWith2BoundaryPoints(points, j, p_i, points[j]);
    }
    return disk;
}


function enclosingDiskWith2BoundaryPoints(points, j, p, q){
    var disk = enclosingDisk2Points(p, q);
    for (var k = 0; k < j; k++){
	if (inDisk(disk, points[k])) {
	    continue;
	}
	disk = enclosingDisk3Points(points[k], p, q);
    }
    return disk;
}

// return the smallest disk enclosing points p and q.
function enclosingDisk2Points(p, q){
    var radius = dist(p, q)/2.0;
    var center = [(p[0] + q[0])/2.0, (p[1] + q[1])/2.0];
    return [center, radius];
}

// return the unique disk with p1, p2, and p3 as boundary points.
function enclosingDisk3Points(_p1, _p2, _p3){

    var p1 = [_p1[0], _p1[1]];
    var p2 = [_p2[0], _p2[1]];
    var p3 = [_p3[0], _p3[1]];
    if (dist(p1, p3) > dist(p1, p2)){
	var p = p2;
	p2 = p3;
	p3 = p;
    }

    var p = p1;
    // make p1 the origin
    p2[0] = p2[0] - p1[0];
    p2[1] = p2[1] - p1[1];
    p3[0] = p3[0] - p1[0];
    p3[1] = p3[1] - p1[1];
    
    // apply rotation matrix to make p2.x = 0
    // the rotation matrix is
    //   | p2[1]/dist(p2), -1 * p2[0]/dist(p2) |
    //   | p2[0]/dist(p2), p2[1]/dist(p2)      |
    //
    var original_p2 = [p2[0], p2[1]];
    p2[0] = 0;
    p2[1] = d(original_p2);

    // apply rotation matrix to p3
    var original_p3 = [p3[0], p3[1]]
    p3[0] = original_p2[1]/d(original_p2) * original_p3[0] - original_p2[0]/d(original_p2) * original_p3[1]
    p3[1] = original_p2[0]/d(original_p2) * original_p3[0] + original_p2[1]/d(original_p2) * original_p3[1]

    // the unique disk with the points p1, p2, and p3 as boundary points is 
    // defined by the equation y = p2.y/2 & x = (d(p3)^2 + p3.y * p2.y)/(2 * p3.x)
    var y = p2[1]/2.0;
    var x = (d(p3) * d(p3) - p3[1] * p2[1])/(2 * p3[0]);

    // apply inverse of rotation matrix 
    var rotated_x = original_p2[1]/d(original_p2) * x + original_p2[0]/d(original_p2) * y
    var rotated_y = -1 * original_p2[0]/d(original_p2) * x + original_p2[1]/d(original_p2) * y;

    // translate back
    rotated_x = rotated_x + p1[0];
    rotated_y = rotated_y + p1[1];
    
    var radius = d([rotated_x - p1[0], rotated_y - p1[1]]);
    return [[rotated_x, rotated_y], radius];
    
}

function inDisk(disk, p){
    var EPSILON = 1e-5;
    var center = disk[0];
    var radius = disk[1];
    return ((p[0] - center[0]) * (p[0] - center[0]) + ((p[1] - center[1]) * (p[1] - center[1])) <= radius * radius + EPSILON);
}

// returns the distance between p and q.
function dist(p, q){   
    return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
}

// return the distance from p to the origin
function d(p) {
    return dist(p, [0, 0]);
}