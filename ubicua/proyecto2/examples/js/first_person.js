var renderer, camera;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;

var controls;
var clock;

var useRift = false;

var riftCam;

var boxes = [];
var core = [];
var dataPackets = [];

var ground, groundGeometry, groundMaterial;

var bodyAngle;
var bodyAxis;
var bodyPosition;
var viewAngle;

var velocity;
var oculusBridge;

var cube,cube2;
var text1;

// Map for key states
var keys = [];
for(var i = 0; i < 130; i++){
  keys.push(false);
}


function initScene() {
  clock = new THREE.Clock();
  mouse = new THREE.Vector2(0, 0);

  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  
  scene = new THREE.Scene();  

  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 10000);
  camera.useQuaternion = true;

  camera.position.set(0, 10, 50);
  camera.lookAt(scene.position);

  // Initialize the renderer
  renderer = new THREE.WebGLRenderer({antialias:true});
  //renderer.setClearColor(0xdbf7ff);
  renderer.setClearColor(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);

   //scene.fog = new THREE.Fog(0xdbf7ff, 300, 700);

  element = document.getElementById('viewport');
  element.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera);
}


function initLights(){

  ambient = new THREE.AmbientLight(0x222222);
  scene.add(ambient);

  point = new THREE.DirectionalLight( 0xffffff, 1, 0, Math.PI, 1 );
  point.position.set( -250, 250, 150 );
  
  scene.add(point);
}

var floorTexture;
function initGeometry(){

  floorTexture = new THREE.ImageUtils.loadTexture( "textures/tiles.jpg" );
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
  floorTexture.repeat.set( 50, 50 );
  floorTexture.anisotropy = 32;

  var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, transparent:true, opacity:0.9 } );
  var floorGeometry = new THREE.PlaneGeometry(1400, 1400, 50, 50);
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;

  scene.add(floor);
  
  //add cube
    var geometryCubo = new THREE.BoxGeometry(5, 5, 5);
    var materialCubo = new THREE.MeshBasicMaterial({color: 0x00ff11});
    cube = new THREE.Mesh(geometryCubo, materialCubo);
    cube.position.set(0, 0, 0);
    //add line
    var geometryPos = new THREE.CylinderGeometry(1, 1, 1, 32);
    var materialPos = new THREE.MeshBasicMaterial({color: 0xffffff,transparent: true,opacity: 0});
    cube2 = new THREE.Mesh(geometryPos, materialPos);
//    cube2.position.set(cube.position.x, cube.position.y+30, cube.position.z+120);
    
    var materialT1 = new THREE.MeshPhongMaterial({
        color: 0x22cc00
    });
    var geometryT1 = new THREE.TextGeometry('Acércate al cubo',{
        size: 3,
        height : 1,
        curveSegments: 32,
        font : "optimer", // helvetiker, optimer, gentilis, droid sans, droid serif
        weight : "bold", // normal bold
        style : "normal" // normal italic
    });
    THREE.GeometryUtils.center( geometryT1 );
    text1 = new THREE.Mesh( geometryT1, materialT1 );
    geometryT1.computeBoundingBox();
    geometryT1.textWidth = geometryT1.boundingBox.max.x - geometryT1.boundingBox.min.x;
    
    text1.position.set(cube.position.x,cube.position.y+10,cube.position.z);
    
    pivot1 = new THREE.Object3D();
    pivot1.position.set(text1.position.x,text1.position.y,text1.position.z);
    pivot1.add(text1);
    
    
//    cube2.position.set(camera.position.x, camera.position.y, camera.position.z-100);
    
    scene.add(cube);
    scene.add(cube2);
    scene.add(text1);
    scene.add(pivot1);
//    scene.add(text);
}


function init(){
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);

  document.getElementById("toggle-render").addEventListener("click", function(){
    useRift = !useRift;
    onResize();
  });

  document.getElementById("help").addEventListener("click", function(){
    var el = document.getElementById("help-text");
    el.style.display = (el.style.display == "none") ? "" : "none";
  });

  window.addEventListener('resize', onResize, false);

  time          = Date.now();
  bodyAngle     = 0;
  bodyAxis      = new THREE.Vector3(0, 1, 0);
  bodyPosition  = new THREE.Vector3(0, 15, 0);
  velocity      = new THREE.Vector3();

  initScene();
  initGeometry();
  initLights();
  
  oculusBridge = new OculusBridge({
    "debug" : true,
    "onOrientationUpdate" : bridgeOrientationUpdated,
    "onConfigUpdate"      : bridgeConfigUpdated,
    "onConnect"           : bridgeConnected,
    "onDisconnect"        : bridgeDisconnected
  });
  oculusBridge.connect();

  riftCam = new THREE.OculusRiftEffect(renderer);
}


function onResize() {
  if(!useRift){
    windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
    aspectRatio = window.innerWidth / window.innerHeight;
    
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
   
    renderer.setSize(window.innerWidth, window.innerHeight);
  } else {
    riftCam.setSize(window.innerWidth, window.innerHeight);
  }
}


function bridgeConnected(){
  document.getElementById("logo").className = "";
}

function bridgeDisconnected(){
  document.getElementById("logo").className = "offline";
}

function bridgeConfigUpdated(config){
  console.log("Oculus config updated.");
  riftCam.setHMD(config);      
}

function bridgeOrientationUpdated(quatValues) {

  // Do first-person style controls (like the Tuscany demo) using the rift and keyboard.

  // TODO: Don't instantiate new objects in here, these should be re-used to avoid garbage collection.

  // make a quaternion for the the body angle rotated about the Y axis.
  var quat = new THREE.Quaternion();
  quat.setFromAxisAngle(bodyAxis, bodyAngle);

  // make a quaternion for the current orientation of the Rift
  var quatCam = new THREE.Quaternion(quatValues.x, quatValues.y, quatValues.z, quatValues.w);

  // multiply the body rotation by the Rift rotation.
  quat.multiply(quatCam);


  // Make a vector pointing along the Z axis and rotate it accoring to the combined look/body angle.
  var xzVector = new THREE.Vector3(0, 0, 1);
  xzVector.applyQuaternion(quat);

  // Compute the X/Z angle based on the combined look/body angle.  This will be used for FPS style movement controls
  // so you can steer with a combination of the keyboard and by moving your head.
  viewAngle = Math.atan2(xzVector.z, xzVector.x) + Math.PI;

  // Apply the combined look/body angle to the camera.
  camera.quaternion.copy(quat);
}


function onMouseMove(event) {
  mouse.set( (event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
}


function onMouseDown(event) {
  // Stub
  floorTexture.needsUpdate = true;
  console.log("update.");
}


function onKeyDown(event) {

  if(event.keyCode == 48){ // zero key.
    useRift = !useRift;
    onResize();
  }

  // prevent repeat keystrokes.
  if(!keys[32] && (event.keyCode == 32)){ // Spacebar to jump
    velocity.y += 1.9;
  }

  keys[event.keyCode] = true;
}


function onKeyUp(event) {
  keys[event.keyCode] = false;
}


function updateInput(delta) {
  
  var step        = 25 * delta;
  var turn_speed  = (55 * delta) * Math.PI / 180;


  // Forward/backward

  if(keys[87] || keys[38]){ // W or UP
      bodyPosition.x += Math.cos(viewAngle) * step;
      bodyPosition.z += Math.sin(viewAngle) * step;
  }

  if(keys[83] || keys[40]){ // S or DOWN
      bodyPosition.x -= Math.cos(viewAngle) * step;
      bodyPosition.z -= Math.sin(viewAngle) * step;
  }

  // Turn

  if(keys[81]){ // E
      bodyAngle += turn_speed;
  }   
  
  if(keys[69]){ // Q
       bodyAngle -= turn_speed;
  }

  // Straif

  if(keys[65] || keys[37]){ // A or LEFT
      bodyPosition.x -= Math.cos(viewAngle + Math.PI/2) * step;
      bodyPosition.z -= Math.sin(viewAngle + Math.PI/2) * step;
  }   
  
  if(keys[68] || keys[39]){ // D or RIGHT
      bodyPosition.x += Math.cos(viewAngle+Math.PI/2) * step;
      bodyPosition.z += Math.sin(viewAngle+Math.PI/2) * step;
  }
  

  // VERY simple gravity/ground plane physics for jumping.
  
  velocity.y -= 0.15;
  
  bodyPosition.y += velocity.y;
  
  if(bodyPosition.y < 15){
    velocity.y *= -0.12;
    bodyPosition.y = 15;
  }

  // update the camera position when rendering to the oculus rift.
  if(useRift) {
    camera.position.set(bodyPosition.x, bodyPosition.y, bodyPosition.z);
  }
}

function animate() {
  var delta = clock.getDelta();
  time += delta;
  
  updateInput(delta);
//  for(var i = 0; i < core.length; i++){
//    core[i].rotation.x += delta * 0.25;
//    core[i].rotation.y -= delta * 0.33;
//    core[i].rotation.z += delta * 0.1278;
//  }

  var bounds = 600;
//  for(var i = 0; i < dataPackets.length; i++){
//    dataPackets[i].obj.position.add( dataPackets[i].speed);
//    if(dataPackets[i].obj.position.x < -bounds) {
//      dataPackets[i].obj.position.x = bounds;
//    } else if(dataPackets[i].obj.position.x > bounds){
//      dataPackets[i].obj.position.x = -bounds;
//    }
//    if(dataPackets[i].obj.position.z < -bounds) {
//      dataPackets[i].obj.position.z = bounds;
//    } else if(dataPackets[i].obj.position.z > bounds){
//      dataPackets[i].obj.position.z = -bounds;
//    }
//  }

  
  if(render()){
    requestAnimationFrame(animate);  
  }
  pcam = camera.position;
  pcub = cube.position;
//  cube2.position.set(pcam.x, pcam.y-1, pcam.z);
  cube2.position.set(pcam.x, pcam.y-10, pcam.z);
  pcub2 = cube2.position;
  xP = Math.pow((pcub.x - pcub2.x), 2);  
  yP = Math.pow((pcub.y - pcub2.y), 2);  
  zP = Math.pow((pcub.z - pcub2.z), 2);  
//  if ( (xP + yP + zP) <= 2500){    //5: Radio del elemento a interactuar
  if ( (xP + yP + zP) <= 500){    //distancia a la cual se hará contacto
      cube.material.color.setHex(0xff00ff);
      document.getElementById('tocando').textContent = "Activo";
      
  }else{
      cube.material.color.setHex(0x00ff11);
      document.getElementById('tocando').textContent = "Inactivo";
  }
  
}

function crashSecurity(e){
  oculusBridge.disconnect();
  document.getElementById("viewport").style.display = "none";
  document.getElementById("security_error").style.display = "block";
}

function crashOther(e){
  oculusBridge.disconnect();
  document.getElementById("viewport").style.display = "none";
  document.getElementById("generic_error").style.display = "block";
  document.getElementById("exception_message").innerHTML = e.message;
}

function render() { 
  try{
    if(useRift){
      riftCam.render(scene, camera);
    }else{
      controls.update();
      renderer.render(scene, camera);
    } 
    text1.rotation.y +=.01;
  } catch(e){
    console.log(e);
    if(e.name == "SecurityError"){
      crashSecurity(e);
    } else {
      crashOther(e);
    }
    return false;
  }
  return true;
}


window.onload = function() {
  init();
  animate();
}