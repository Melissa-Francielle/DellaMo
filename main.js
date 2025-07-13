// Variáveis globais 
let scene, camera, renderer;
let isGameStarted = false;
let modelLoaded = false;
let player;
const move = { forward: false, backward: false, left: false, right: false };
const speed = 0.1;
const rotationSpeed = 0.05;
let playerDirection = new THREE.Vector3();
let playerRotation = 0; // Ângulo de rotação do jogador em radianos

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

        // Configuração da câmera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.set(0, 2, -5);

        // Iluminação
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        scene.add(sunLight);

        const pointLight = new THREE.PointLight(0xffccaa, 0.5);
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);

        // Personagem (cubo temporário)
        const cubeGeometry = new THREE.BoxGeometry(1, 2, 1);
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        player = new THREE.Mesh(cubeGeometry, cubeMaterial);
        player.position.set(54.78, 1, 43.58);
        player.castShadow = true;
        scene.add(player);

        loadModel();

        // Event listeners
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

    // Atualiza a rotação do personagem
    if (move.left) playerRotation += rotationSpeed;
    if (move.right) playerRotation -= rotationSpeed;
    
    // Aplica a rotação ao personagem
    player.rotation.y = playerRotation;

    // Calcula a direção do movimento baseado na rotação
    playerDirection.set(0, 0, 0);
    
    if (move.forward) {
        playerDirection.z -= Math.cos(playerRotation);
        playerDirection.x -= Math.sin(playerRotation);
    }
    if (move.backward) {
        playerDirection.z += Math.cos(playerRotation);
        playerDirection.x += Math.sin(playerRotation);
    }

    if (playerDirection.length() > 0) {
        playerDirection.normalize();
        player.position.add(playerDirection.clone().multiplyScalar(speed));
    }
}

function updateCamera() {
    if (!isGameStarted) return;

    // Offset da câmera (atrás e acima do personagem)
    const distanceBehind = 5;
    const heightAbove = 2;
    
    // Calcula a posição da câmera baseada na rotação do jogador
    const cameraOffsetX = Math.sin(playerRotation) * distanceBehind;
    const cameraOffsetZ = Math.cos(playerRotation) * distanceBehind;
    
    const targetPosition = new THREE.Vector3(
        player.position.x + cameraOffsetX,
        player.position.y + heightAbove,
        player.position.z + cameraOffsetZ
    );
    
    // Suaviza o movimento da câmera
    camera.position.lerp(targetPosition, 0.1);
    
    // Faz a câmera olhar ligeiramente acima do personagem
    camera.lookAt(
        player.position.x,
        player.position.y + 1,
        player.position.z
    );
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
