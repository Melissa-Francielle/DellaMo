// Variáveis globais 
let scene, camera, renderer;
let nextJumpTime = 0;
let isGameStarted = false;
let modelLoaded = false;
let player;
let worldModel, bandeira, bolinha1, bolinha2;
let playerDirection = new THREE.Vector3();
let world, ballBody;
let npc;
let npcGeometry, npcMaterial; // Adicione estas linhas
let isDialogueActive = false;
let currentDialogue = [];
let currentDialogueIndex = 0;
let playerRotation = 0; // Ângulo de rotação do jogador em radianos
const move = { forward: false, backward: false, left: false, right: false };
const speed = 0.2;
const rotationSpeed = 0.05;
const portalLight = null;
const gravity = -9.82;
const jumpInterval = 1000;
const dialogueContainer = document.getElementById('dialogue-container');
const dialogueText = document.getElementById('dialogue-text');
const nextBtn = document.getElementById('next-btn');
const keyboard = {};
const dialogueKeys = {
    'e': false,
    'Enter': false
};

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

        // Cria a bolinha visual (Three.js)
        const ballGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Vermelha
        ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        scene.add(ballMesh);
        // Iluminação
         // Luz azul do portal (PointLight)
        const portalLight = new THREE.PointLight(
            0x00aaff, // Cor azul clara
            2,         // Intensidade forte
            10,        // Alcance (distância)
            2          // Decaimento (suaviza bordas)
        );
        portalLight.position.set(56.57, 3.5, 43.72); // Posição Y=3.5 para ficar acima do portal
        scene.add(portalLight);

        // Efeito de névoa azul (opcional)
        const portalFog = new THREE.FogExp2(0x00aaff, 0.02);
        scene.fog = portalFog;
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        scene.add(sunLight);

        pointLight = new THREE.PointLight(0xffccaa, 0.5);
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);

        // Adiciona nuvens altas (Y entre 15 e 25)
        const cloud1 = createCloud();
        cloud1.position.set(30, 20, 10); // Nuvem alta à direita
        scene.add(cloud1);

        const cloud2 = createCloud();
        cloud2.position.set(-20, 18, 40); // Nuvem alta à esquerda
        scene.add(cloud2);

        const cloud3 = createCloud();
        cloud3.position.set(0, 25, -30); // Nuvem alta ao fundo
        scene.add(cloud3);

                // Configuração do mundo físico
        world = new CANNON.World();
        world.gravity.set(0, gravity, 0); // Gravidade para baixo
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        // Corpo físico da bolinha
        const ballShape = new CANNON.Sphere(0.5); // Raio 0.5 (igual ao visual)
        ballBody = new CANNON.Body({
            mass: 1, // Massa > 0 para ser afetada pela física
            shape: ballShape,
            position: new CANNON.Vec3(0, 5, 0), // Posição inicial no ar para cair
            linearDamping: 0.3, // Resistência do ar/atrito
            material: new CANNON.Material({ restitution: 0.7 }) // Elasticidade/quique
        });
        world.addBody(ballBody);

        // Criar chão físico
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0, // Massa 0 = objeto estático/imóvel
            shape: groundShape,
            material: new CANNON.Material({ restitution: 0.3 })
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotação para ficar horizontal
        world.addBody(groundBody);

        // Posiciona a bolinha visual igual à física
        ballMesh.position.copy(ballBody.position);

        // Continua com o loadModel()...
        loadModel();
        // Personagem (cubo temporário)
        const cubeGeometry = new THREE.BoxGeometry(1, 2, 1);
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        player = new THREE.Mesh(cubeGeometry, cubeMaterial);
        player.position.set(54.78, 1, 43.58);
        player.castShadow = true;
        scene.add(player);

        // NPC placeholder (cubo vermelho)
        npcGeometry = new THREE.BoxGeometry(1, 2, 1);
        npcMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        npc = new THREE.Mesh(npcGeometry, npcMaterial);
        npc.position.set(-34.569711638825716, 1, -40.39031521964688);
        npc.castShadow = true;
        npc.userData = {
            isNPC: true,
            dialogue: [
                "Oh! Olá!",
                "Desculpe, mas eu não estou com muito tempo! Minha gatinha sumiu... de novo, e preciso encontrá-la!",
                "...",
                "O que? Você quer me ajudar?",
                "Você é muito gentil! Mas não sei se você vai conseguir...",
                "Ela é muito rápida e gosta de se esconder em vários lugares.", 
                "Você também está procurando algo?",
                "Fermento? Hm estranho... mas se você conseguir encontrar minha gatinha, eu posso te dar o meu fermento!",
                "Acho uma troca justa, não acha? Você aceita?"
            ],
            interactionRadius: 3
        };
        scene.add(npc);

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
    const modelsToLoad = [
        { name: 'world', path: 'Modelos/world.glb' },
        { name: 'bandeira', path: 'Modelos/flag-green.glb', pos: { x: -40.81, y: 0,z: -29.03 } },
        { name: 'bolinha1', path: 'Modelos/ball-blue.glb', pos: { x: -14.70, y: 0, z: -43.79 } },
        { name: 'bolinha2', path: 'Modelos/ball-green.glb', pos: { x: -20.14, y: 0, z: -45.07 } }
        // Adicione bolinha3 se necessário
    ];
    

    let loadedCount = 0;

    modelsToLoad.forEach(model => {
        loader.load(
            model.path,
            (gltf) => {
                switch (model.name) {
                    case 'world':
                        worldModel = gltf.scene;
                        scene.add(worldModel);

                        break;
                    case 'bandeira':
                        bandeira = gltf.scene;
                        bandeira.position.set(model.pos.x, model.pos.y, model.pos.z);
                        bandeira.scale.set(0.5, 0.5, 0.5); // Ajuste se necessário
                        scene.add(bandeira);
                        break;
                    case 'bolinha1':
                        bolinha1 = gltf.scene;
                        bolinha1.position.set(model.pos.x, model.pos.y, model.pos.z);
                        scene.add(bolinha1);
                        break;
                    case 'bolinha2':
                        bolinha2 = gltf.scene;
                        bolinha2.position.set(model.pos.x, model.pos.y, model.pos.z);
                        scene.add(bolinha2);
                        break;
                }

                loadedCount++;
                loadingBar.style.width = `${(loadedCount / modelsToLoad.length) * 100}%`;

                if (loadedCount === modelsToLoad.length) {
                    document.getElementById("loading-container").style.display = 'none';
                    modelLoaded = true;
                    console.log("Todos os modelos carregados!");
                }
            },
            undefined,
            (error) => {
                console.error(`Erro ao carregar ${model.path}:`, error);
                loadingBar.style.backgroundColor = 'red';
            }
        );
    });
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
    keyboard[event.code] = true;
    
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
        case 'KeyE':
        case 'Enter':
            if (isDialogueActive) {
                nextDialogue();
            } else {
                checkNPCInteraction();
            }
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
        case 'KeyE':
        case 'Enter':
            dialogueKeys[event.code] = false;
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

        // ... (código existente, depois das luzes)

        // Criação das nuvens
function createCloud() {
    const cloud = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(1, 8, 8); // Low poly (8 segmentos)
    const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF, // Branco puro
        transparent: true,
        opacity: 0.8,
        flatShading: true, // Bordas marcadas (essencial para low poly!)
        specular: 0x111111 // Brilho sutil
    });

    // Posições aleatórias (mais altas e espalhadas)
    const positions = [
        { x: 0, y: 0, z: 0 },       // Centro
        { x: -1.5, y: 1.2, z: -0.3 }, // Esquerda superior
        { x: 1.5, y: 0.8, z: 0.4 },  // Direita superior
        { x: 0.5, y: 1.5, z: -0.2 }, // Topo direito
        { x: -0.7, y: -0.5, z: 0.6 }, // Base esquerda
        { x: 0.3, y: -0.9, z: -0.7 }  // Base direita
    ];

    // Cria esferas com escalas variadas para mais naturalidade
    positions.forEach(pos => {
        const sphere = new THREE.Mesh(sphereGeometry, cloudMaterial);
        sphere.position.set(pos.x, pos.y, pos.z);
        
        // Escalas aleatórias para efeito orgânico
        const scale = 0.8 + Math.random() * 0.5; // Entre 0.8 e 1.3
        sphere.scale.set(scale, scale * 0.7, scale);
        
        cloud.add(sphere);
    });

    return cloud;
}


function checkNPCInteraction() {
    if (!isGameStarted || isDialogueActive) return;
    
    const distance = player.position.distanceTo(npc.position);
    const canInteract = distance < npc.userData.interactionRadius;
    
    if (canInteract) {
        startDialogue(npc.userData.dialogue);
    }
}

function startDialogue(dialogueLines) {
    isDialogueActive = true;
    currentDialogue = dialogueLines;
    currentDialogueIndex = 0;
    showDialogue(currentDialogue[currentDialogueIndex]);
    
    // Adiciona feedback visual no NPC (opcional)
    npc.material.color.setHex(0x00ff00); // Muda para verde
}

function showDialogue(text) {
    const dialogueContainer = document.getElementById('dialogue-container');
    const dialogueText = document.getElementById('dialogue-text');
    
    dialogueContainer.style.display = 'flex';
    
    // Efeito de digitação
    let i = 0;
    dialogueText.textContent = '';
    const typingEffect = setInterval(() => {
        if (i < text.length) {
            dialogueText.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typingEffect);
        }
    }, 20); // Velocidade da digitação
}

function nextDialogue() {
    currentDialogueIndex++;
    
    if (currentDialogueIndex < currentDialogue.length) {
        showDialogue(currentDialogue[currentDialogueIndex]);
    } else {
        endDialogue();
    }
}

function endDialogue() {
    isDialogueActive = false;
    document.getElementById('dialogue-container').style.display = 'none';
    npc.material.color.setHex(0xff0000); // Volta para vermelho
}

function animate() {
    world.step(1/60);  
    requestAnimationFrame(animate);

    updatePlayerMovement();
    updateCamera();

    // Anima a luz do portal
    if (portalLight) {
        const time = Date.now() * 0.001; // Tempo em segundos
        portalLight.intensity = 1.5 + Math.sin(time * 3) * 1; // Pulsa entre 0.5 e 2.5
        portalLight.color.setHSL(0.6, 1, 0.5 + Math.sin(time) * 0.2); // Variação sutil de tom
    }

    // Faz a bolinha pular quando toca o chão
    if (ballBody.position.y <= 0.51 && Math.abs(ballBody.velocity.y) < 0.1) {
        ballBody.velocity.y = 5; // impulso vertical para cima
    }
    const distance = player.position.distanceTo(npc.position);
    const canInteract = distance < npc.userData.interactionRadius;
    
    if (canInteract && !isDialogueActive) {
        npc.material.color.setHex(0xffff00); // Amarelo quando pode interagir
    } else if (!isDialogueActive) {
        npc.material.color.setHex(0xff0000); // Vermelho quando não pode
    }
    //console.log("Player Position:", player.position); 

    // Renderiza a cena
    renderer.render(scene, camera);
}

// Inicia quando a página carrega
window.addEventListener('load', init);
