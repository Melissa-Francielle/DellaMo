// Variáveis globais 
let scene, camera, renderer, controls;
let isGameStarted = false;
let modelLoaded = false;
let player;
const move = { forward: false, backward: false, left: false, right: false };
const speed = 0.1;
let playerDirection = new THREE.Vector3();

// Inicialização principal
function init() {
    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // céu azul

        renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#background'),
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;

        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.set(0, 2, -5);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enabled = false; // Desativa controles após começar

        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        scene.add(sunLight);

        const pointLight = new THREE.PointLight(0xffccaa, 0.5);
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);

        const cubeGeometry = new THREE.BoxGeometry(1, 2, 1);
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        player = new THREE.Mesh(cubeGeometry, cubeMaterial);
        player.position.set(0, 1, 0);
        player.castShadow = true;
        scene.add(player);

        loadModel();

        document.getElementById("start-btn").addEventListener("click", startGame);
        document.getElementById("exit-btn").addEventListener("click", () => {
            if (confirm("Sair?")) window.close();
        });
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        animate();
    } catch (error) {
        console.error("Erro na inicialização:", error);
        alert("Erro ao iniciar o jogo. Verifique o console.");
    }
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    const loadingBar = document.getElementById('loading-bar');

    loader.load(
        'Modelos/world.glb',
        (gltf) => {
            scene.add(gltf.scene);
            document.getElementById("loading-container").style.display = 'none';
            modelLoaded = true;
            console.log("Modelo carregado!");
        },
        (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            loadingBar.style.width = `${percent}%`;
        },
        (error) => {
            console.error("Erro ao carregar:", error);
            loadingBar.style.backgroundColor = 'red';
            alert("Erro ao carregar o modelo. Verifique o console.");
        }
    );
}

function startGame() {
    if (!modelLoaded) {
        alert("Aguarde o modelo carregar completamente!");
        return;
    }

    document.querySelector('.menu-container').style.display = 'none';
    document.querySelector('.game').style.display = 'block';

    isGameStarted = true;
    controls.enabled = true;
    controls.target.copy(player.position);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            move.forward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            move.backward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            move.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            move.right = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            move.forward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            move.backward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            move.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            move.right = false;
            break;
    }
}

function updatePlayerMovement() {
    if (!isGameStarted) return;

    playerDirection.set(0, 0, 0);

    if (move.forward) playerDirection.z -= 1;
    if (move.backward) playerDirection.z += 1;
    if (move.left) playerDirection.x -= 1;
    if (move.right) playerDirection.x += 1;

    if (playerDirection.length() > 0) {
        playerDirection.normalize();
        player.position.add(playerDirection.clone().multiplyScalar(speed));
    }
}

function updateCamera() {
    if (!isGameStarted) return;

    // Faz a câmera acompanhar a posição do personagem
    const offset = new THREE.Vector3(0, 4, -6);
    const targetPosition = player.position.clone().add(offset);
    camera.position.lerp(targetPosition, 0.05);

    // OrbitControls ajusta a rotação livremente com o mouse
    controls.target.copy(player.position.clone().add(new THREE.Vector3(0, 1, 0)));
    controls.update();
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    updatePlayerMovement();
    updateCamera();

    renderer.render(scene, camera);
}

// Inicia quando a página carrega
window.addEventListener('load', init);
