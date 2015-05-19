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

var cube,posicion;
//var text1;

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

  camera.position.set(-700, 25, -100);
    //camera.lookAt(new THREE.Vector3( 0.5, 0.0, 0.8 ));
  //camera.lookAt(scene.position);

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

    floorTexture = new THREE.ImageUtils.loadTexture( "textures/6.jpg" );
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set( 50, 50 );
    floorTexture.anisotropy = 32;

    var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, transparent:true, opacity:0.9 } );
    var floorGeometry = new THREE.PlaneGeometry(1400, 1400, 50, 50);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;

    scene.add(floor);

    cuboImagen = [];
    texts = [];
    preguntas = [];
    respuestas = [];


    creaTextos();
    creaPreguntas();
    creaRespuestas();
    creaParedes();
    creaIntro();
    creaDiapIzq();
    creaDiapDer();


    for(i=0;i<preguntas.length;i++){
        scene.add( preguntas[i] );
    }
    scene.add(cube);
    for(i=0;i<texts.length;i++){
        scene.add( texts[i] );
    }
    for(i=0;i<cuboImagen.length;i++){
        scene.add( cuboImagen[i] );
    }
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
  bodyPosition  = new THREE.Vector3(-700, 15, -100);
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
    var bounds = 600;
    if(render()){
        requestAnimationFrame(animate);
    }
    evaluaRespuestas();
}
function evaluaRespuestas(){
    var pcam = camera.position;
    var xP,yP,zP;
    for(i=0;i<respuestas.length;i++){
        if(respuestas[i].evaluada == 1){
            continue;
        }
        xP = Math.pow((respuestas[i].x - pcam.x), 2);
        yP = Math.pow((respuestas[i].y - pcam.y), 2);
        zP = Math.pow((respuestas[i].z - pcam.z), 2);
        if ( (xP + yP + zP) <= 1000){    //distancia a la cual se hará contacto
            respuestas[i].responde();
            scene.remove(texts[respuestas[i].indiceTexto]);
            if(i%2==0){
                respuestas[i+1].evaluada = 1;
                scene.remove(texts[respuestas[i+1].indiceTexto]);
            }else{
                respuestas[i-1].evaluada = 1;
                scene.remove(texts[respuestas[i-1].indiceTexto]);
            }
        }
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
    //text1.rotation.y +=.01;
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



function creaParedes(){
    materialArray = arreglomateriales();
    materialArray[2] = new THREE.MeshBasicMaterial( { color: 0x8B0000 });
    materialArray[3] = new THREE.MeshBasicMaterial( { color: 0x8B0000 });
    materialArray[3] = new THREE.MeshBasicMaterial( { color: 0x8B0000 });
    materialArray[3] = new THREE.MeshBasicMaterial( { color: 0x8B0000 });
    materialImagen2d = new THREE.MeshFaceMaterial(materialArray);
    geometryPared = new THREE.CubeGeometry( 1400, 10, 1400 );

    pared =new THREE.Mesh( geometryPared, materialImagen2d);
    pared.position.set(0, 70, 0);
    scene.add( pared );

    materialArray = arreglomateriales();
    materialImagen2d = new THREE.MeshFaceMaterial(materialArray);
    geometryPared = new THREE.CubeGeometry( 1400, 70, 600 );

    pared =new THREE.Mesh( geometryPared, materialImagen2d);
    pared.position.set(0, 35, -450);
    scene.add( pared );

    materialArray = arreglomateriales();
    materialImagen2d = new THREE.MeshFaceMaterial(materialArray);
    geometryPared = new THREE.CubeGeometry( 1100, 70, 700 );

    pared =new THREE.Mesh( geometryPared, materialImagen2d);
    pared.position.set(-150, 35, 350);
    scene.add( pared );

    materialArray = arreglomateriales();
    materialImagen2d = new THREE.MeshFaceMaterial(materialArray);
    geometryPared = new THREE.CubeGeometry( 100, 70, 1000 );

    pared =new THREE.Mesh( geometryPared, materialImagen2d);
    pared.position.set(650, 35, 200);
    scene.add( pared );
}
function creaIntro(){
    geometryImagen2d = new THREE.CubeGeometry( 2, 10, 2 );
    var materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x600000 }));//derecha
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x600000 }));//izquierda
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//arriba
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//abajo
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x800000 }));//frente
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x800000 }));//atrás
    materialImagen2d = new THREE.MeshFaceMaterial(materialArray);
    d = new THREE.Mesh( geometryImagen2d, materialImagen2d);
    d.position.set(-620, 5,-80);
    cuboImagen.push(d);

    geometryImagen2d = new THREE.CubeGeometry( 1, 8, 10 );
    var materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//derecha
    materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture('img/caratula.jpg') }));//izquierda
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//arriba
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//abajo
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//frente
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//atrás
    materialImagen2d = new THREE.MeshFaceMaterial(materialArray);
    d = new THREE.Mesh( geometryImagen2d, materialImagen2d);
    d.position.set(-620, 11,-80);
    d.rotation.z = -.75;
    cuboImagen.push(d);
}
function creaDiapIzq(){
    geometryImagen2d = new THREE.CubeGeometry( 83, 50, 5 );
    cuboImagen.push(creaDiapositiva(-400,25,-130,'img/presentacion/d2.jpg',4));
    cuboImagen.push(creaDiapositiva(-200,25,-130,'img/presentacion/d4.jpg',4));
    cuboImagen.push(creaDiapositiva(0,25,-130,'img/presentacion/d6.jpg',4));
    cuboImagen.push(creaDiapositiva(200,25,-130,'img/presentacion/d8.jpg',4));
    cuboImagen.push(creaDiapositiva(400,25,-130,'img/presentacion/d10.jpg',4));
}
function creaDiapDer(){
    geometryImagen2d = new THREE.CubeGeometry( 83, 50, 5 );
    cuboImagen.push(creaDiapositiva(-500,25,-20,'img/presentacion/d1.jpg',5));
    cuboImagen.push(creaDiapositiva(-300,25,-20,'img/presentacion/d3.jpg',5));
    cuboImagen.push(creaDiapositiva(-100,25,-20,'img/presentacion/d5.jpg',5));
    cuboImagen.push(creaDiapositiva(100,25,-20,'img/presentacion/d7.jpg',5));
    cuboImagen.push(creaDiapositiva(300,25,-20,'img/presentacion/d9.jpg',5));
}
function creaPreguntas(){
    geometryImagen2d = new THREE.CubeGeometry( 5, 50, 120 );
    preguntas.push(creaDiapositiva(580,25,200,'img/preguntas/p1.jpg',1));
    preguntas.push(creaDiapositiva(580,25,600,'img/preguntas/p2.jpg',1));
    preguntas.push(creaDiapositiva(420,25,200,'img/preguntas/p3.jpg',0));
    preguntas.push(creaDiapositiva(420,25,600,'img/preguntas/p4.jpg',0));
}
function creaDiapositiva(x,y,z,ruta,i_imagen){
    materialArray = arreglomaterialesDiap();
    materialArray[i_imagen]= new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture(ruta) });
    materialImagen2d = new THREE.MeshFaceMaterial(materialArray);
    d = new THREE.Mesh( geometryImagen2d, materialImagen2d);
    d.position.set(x, y,z);
    return d;
}
function arreglomateriales( ){
    var materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x86593A }));//derecha
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x86593A }));//izquierda
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x8B0000 }));//arriba
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x8B0000 }));//abajo
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0xA27651 }));//frente
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0xA27651 }));//atrás
    return materialArray;
}
function arreglomaterialesDiap(){
    var materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial( {color: 0x000000 }));//derecha
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//izquierda
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//arriba
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//abajo
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//frente
    materialArray.push(new THREE.MeshBasicMaterial( { color: 0x000000 }));//atrás
    return materialArray;
}
function creaTextos(){
    texts.push(creaTexto('Cuestionario',0xffffff,599,50,-70,-1.57,1));
    texts.push(creaTexto('->',0xffffff,599,20,-70,-1.57,1));
}

function creaTexto(cadena,color,x,y,z,r,h){
    materialT = new THREE.MeshBasicMaterial({
        color: color
    });
    geometryT = new THREE.TextGeometry(cadena,{
        size: 15,
        height : h,
        curveSegments: 32,
        font : "optimer", // helvetiker, optimer, gentilis, droid sans, droid serif
        weight : "bold", // normal bold
        style : "normal" // normal italic
    });
    THREE.GeometryUtils.center( geometryT );
    t = new THREE.Mesh( geometryT, materialT );
    geometryT.computeBoundingBox();
    geometryT.textWidth = geometryT.boundingBox.max.x - geometryT.boundingBox.min.x;
    t.position.set(x,y,z);
    t.rotation.y = r;
    return t;
}
function creaRespuestas(){

    
    respuestas.push(new Respuesta('F',preguntas[0],-1.57,0,1,1));
    respuestas.push(new Respuesta('V',preguntas[0],-1.57,1,1,1));

    respuestas.push(new Respuesta('F',preguntas[1],-1.57,0,1,1));
    respuestas.push(new Respuesta('V',preguntas[1],-1.57,1,1,1));

    respuestas.push(new Respuesta('F',preguntas[2],1.57,1,0,0));
    respuestas.push(new Respuesta('V',preguntas[2],1.57,0,0,0));

    respuestas.push(new Respuesta('F',preguntas[3],1.57,0,1,0));
    respuestas.push(new Respuesta('V',preguntas[3],1.57,1,1,0));

}
/**
 * Crea un objeto que contiene la información
 * necesaria para dibujar una respuesta en la pantalla
 * @param {string} texto  una opción de respuesta
 * @param {THREE.Mesh} pregunta superficie donde se encuentra dibujada la pregunta
 * @param {float} rot rotación del texto con respecto al eje Y
 * @param {boolean} esCorrecta indica si la opcion es correcta
 * @param {boolean} res indica cual es la respuesta correcta
 * @param {boolean} antes indica si la respuesta correcta se dibuja 
 * antes o despues de la pregunta con respecto al eje X
 * @returns {Respuesta} Objeto Respuesta
 */
function Respuesta(texto,pregunta,rot,esCorrecta,res,antes){
    this.evaluada = 0;
    this.correcta = esCorrecta;
    this.x = pregunta.position.x;
    this.y = 20;
    this.z = texto=='F'?pregunta.position.z-80:pregunta.position.z+80;
    this.resx = antes?this.x-10:this.x+10;
    this.resy = this.y-10;
    this.resz = pregunta.position.z;
    this.indiceTexto = texts.length;
    this.res = res;
    this.rot = rot;
    texts.push(creaTexto(
        texto,
        texto=='F'?0xff0000:0x00ff00,
        this.x,
        this.y,
        this.z,
        rot,
        1
    ));
    this.responde = function(){
        respuesta = this;
        if(respuesta.correcta) {
            var target = document.getElementById('correctas');
            target.textContent = parseInt(target.textContent) + 1 ;
        }else{
            var target = document.getElementById('incorrectas');
            target.textContent = parseInt(target.textContent) + 1;

        }
        texts.push(creaTexto(
            respuesta.res?'Verdadero':'falso',
            respuesta.res?0x00ff00:0xff0000,
            respuesta.resx,
            respuesta.resy,
            respuesta.resz,
            respuesta.rot,
            1
        ));
        scene.add(texts[texts.length-1]);
        respuesta.evaluada = 1;
    }
}
