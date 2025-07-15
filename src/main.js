// Variáveis globais 
let scene, camera, renderer;
let nextJumpTime = 0;
let isGameStarted = false;
let idleAction, runAction;
let currentAction;
let modelLoaded = false;
let gatito; 
let player;
let missionCompleted = false;
let worldModel, bandeira, bolinha1, bolinha2;
let playerDirection = new THREE.Vector3();
let world, ballBody;
let npc;
let npcGeometry, npcMaterial; 
let npcMixer, npcWavingAction;
let isDialogueActive = false;
let missionAccepted = false;
let currentDialogue = [];
let playerMixer; 
let playerModel; 
let currentDialogueIndex = 0;
let playerRotation = 0; 
const move = { forward: false, backward: false, left: false, right: false };
const speed = 0.2;
const rotationSpeed = 0.05;
const portalLight = null;
const gravity = -9.82;
const jumpInterval = 1000;
const dialogueContainer = document.getElementById('dialogue-container');
const dialogueText = document.getElementById('dialogue-text');
const nextBtn = document.getElementById('next-btn');
const dialogueOptions = document.getElementById('dialogue-options');
const optionYes = document.getElementById('option-yes');
const optionNo = document.getElementById('option-no');
const notificationContainer = document.getElementById('notification-container');
const notificationTitle = document.querySelector('.notification-title');
const notificationMessage = document.querySelector('.notification-message');
const notificationIcon = document.querySelector('.notification-icon');
const endScreen = document.getElementById('end-screen');
const keyboard = {};
const dialogueKeys = {
    'e': false,
    'Enter': false
};
const gatitoPositions = [
    { x: 30.04286988065912, y: 0, z: -52.35017664231537 },
    { x: 5.362324223777308, y: 0, z: -8.237468304920045 },
    { x: -56.701907169283785, y: 0, z: 51.72331850242547 },
    { x: 6.433333380921285, y: 0, z: 18.2950350455932 }
];



function init() {
    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); 

        renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#background'),
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(20, 40, 20);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 100;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        scene.add(sunLight);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.set(0, 2, -5);

        const ballGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Vermelha
        ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        scene.add(ballMesh);

        const portalLight = new THREE.PointLight(
            0x00aaff, 
            2,         
            10,        
            2          
        );
        portalLight.position.set(56.57, 3.5, 43.72); 
        scene.add(portalLight);

        
        const portalFog = new THREE.FogExp2(0xffe0b2, 0.02);
        scene.fog = portalFog;
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        scene.add(sunLight);

        pointLight = new THREE.PointLight(0xffd700, 0.5);
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);

        const cloud1 = createCloud();
        cloud1.position.set(30, 20, 10); 
        scene.add(cloud1);

        const cloud2 = createCloud();
        cloud2.position.set(-20, 18, 40); 
        scene.add(cloud2);

        const cloud3 = createCloud();
        cloud3.position.set(0, 25, -30); 
        scene.add(cloud3);

        world = new CANNON.World();
        world.gravity.set(0, gravity, 0); 
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        const listener = new THREE.AudioListener();
        camera.add(listener); 
        const backgroundSound = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('Audio/FermentoChapter.ogg', function(buffer) {
            backgroundSound.setBuffer(buffer);
            backgroundSound.setLoop(true);
            backgroundSound.setVolume(0.5); 
            backgroundSound.play();
        });


        
        const ballShape = new CANNON.Sphere(0.5); 
        ballBody = new CANNON.Body({
            mass: 1, 
            shape: ballShape,
            position: new CANNON.Vec3(0, 5, 0), 
            linearDamping: 0.3, 
            material: new CANNON.Material({ restitution: 0.7 }) 
        });
        world.addBody(ballBody);

        
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0, 
            shape: groundShape,
            material: new CANNON.Material({ restitution: 0.3 })
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); 
        world.addBody(groundBody);

        ballMesh.position.copy(ballBody.position);

        loadModel();


        
        optionYes.addEventListener('click', () => selectOption(true));
        optionNo.addEventListener('click', () => selectOption(false));

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
        { name: 'world', path: 'Modelos/world_new.glb' },
        { name: 'bandeira', path: 'Modelos/flag-green.glb', pos: { x: -40.81, y: 0,z: -29.03 } },
        { name: 'bolinha2', path: 'Modelos/ball-green.glb', pos: { x: -20.14, y: 0, z: -45.07 } },
        { name: 'player', path: 'Modelos/Personagens/DellaAnimation.glb' },
        { name: 'npc', path: 'Modelos/Personagens/MR.glb' },
        { name: 'gatito', path: 'Modelos/Personagens/cat.glb' }
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
                        enableShadows(worldModel);  

                        break;
                    case 'bandeira':
                        bandeira = gltf.scene;
                        bandeira.position.set(model.pos.x, model.pos.y, model.pos.z);
                        bandeira.scale.set(0.5, 0.5, 0.5); 
                        scene.add(bandeira);
                        enableShadows(bandeira);    
                        break;

                    case 'bolinha2':
                        bolinha2 = gltf.scene;
                        bolinha2.position.set(model.pos.x, model.pos.y, model.pos.z);
                        scene.add(bolinha2);
                        enableShadows(bolinha2);    
                        break;
                    case 'player':
                        playerModel = gltf.scene;
                        playerModel.position.set(54.78, 0, 43.58);
                        playerModel.scale.set(0.8, 0.8, 0.8);
                        playerModel.rotation.y = Math.PI;
                        scene.add(playerModel);
                        enableShadows(playerModel); 
                        playerMixer = new THREE.AnimationMixer(playerModel);

                        gltf.animations.forEach(clip => {
                            console.log("Animação encontrada:", clip.name);
                            if (clip.name.toLowerCase().includes("idle")) {
                                idleAction = playerMixer.clipAction(clip);
                            } else if (clip.name.toLowerCase().includes("run")) {
                                runAction = playerMixer.clipAction(clip);
                            }
                        });

                        if (idleAction) {
                            idleAction.play();
                            currentAction = idleAction;
                        }

                        player = playerModel;
                        break;
                    case 'npc':
                            npc = gltf.scene;
                            npc.position.set(-34.57, 0, -40.39); 
                            npc.scale.set(2, 2, 2); 
                            scene.add(npc);
                            if (npc) enableShadows(npc);
                            if (gltf.animations && gltf.animations.length > 0) {
                                npcMixer = new THREE.AnimationMixer(npc);
                                npcWavingAction = npcMixer.clipAction(gltf.animations[0]);
                                npcWavingAction.play();
                            }

                            npc.userData = {
                                isNPC: true,
                                dialogue: [
                                    "Oh Olá!",
                                    "Quem é você? Bom, eu sou Maria, estou tentando encontrar minha gatinha, ela sumiu... de novo!",
                                    "...",
                                    "O que? Você quer me ajudar?",
                                    "Você é muito gentil! Mas não sei se você vai conseguir...",
                                    "Ela é muito rápida e gosta de se esconder em vários lugares.",
                                    "Você também está procurando algo?",
                                    "Fermento? Hm estranho... mas se você conseguir encontrar minha gatita, eu posso te dar o meu fermento!",
                                    "..."
                                ],
                                pendingDialogue: [
                                    "Você vai aceitar me ajudar?"
                                ],
                                waitingDialogue: [
                                    "Estarei aguardando você aqui!"
                                ],
                                interactionRadius: 3
                            };
                            break;
                    case 'gatito':
                        gatito = gltf.scene;
                        gatito.visible = false; 
                        gatito.scale.set(0.02, 0.02, 0.02);
                        scene.add(gatito);
                        break;
                }

                loadedCount++;
                loadingBar.style.width = `${(loadedCount / modelsToLoad.length) * 100}%`;

                if (loadedCount === modelsToLoad.length) {
                    document.getElementById("loading-container").style.display = 'none';
                    modelLoaded = true;
                    console.log("Todos os modelos carregados!");
                }
                enableShadows(playerModel); 
                
                
               
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

    if (move.left) playerRotation += rotationSpeed;
    if (move.right) playerRotation -= rotationSpeed;
    
    playerModel.rotation.y = playerRotation + Math.PI; 
    playerModel.position.add(playerDirection.clone().multiplyScalar(speed));


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
        playerModel.position.add(playerDirection.clone().multiplyScalar(speed));
        if (runAction && currentAction !== runAction) {
            switchAnimation(runAction);
        }
    } else {
        if (idleAction && currentAction !== idleAction) {
            switchAnimation(idleAction);
        }
    }

}

function enableShadows(object) {
    if (!object || typeof object.traverse !== "function") return;
    object.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

function updateCamera() {
    if (!isGameStarted || !player) return;

    const distance = 5, height = 2;
    const offsetX = Math.sin(playerRotation) * distance;
    const offsetZ = Math.cos(playerRotation) * distance;

    const targetPosition = new THREE.Vector3(
        player.position.x + offsetX,
        player.position.y + height,
        player.position.z + offsetZ
    );

    camera.position.lerp(targetPosition, 0.1);
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

function createCloud() {
    const cloud = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(1, 8, 8); 
    const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF, // Branco puro
        transparent: true,
        opacity: 0.8,
        flatShading: true, 
        specular: 0x111111 
    }); 


    const positions = [
        { x: 0, y: 0, z: 0 },       
        { x: -1.5, y: 1.2, z: -0.3 }, 
        { x: 1.5, y: 0.8, z: 0.4 },  
        { x: 0.5, y: 1.5, z: -0.2 }, 
        { x: -0.7, y: -0.5, z: 0.6 }, 
        { x: 0.3, y: -0.9, z: -0.7 }  
    ];

    positions.forEach(pos => {
        const sphere = new THREE.Mesh(sphereGeometry, cloudMaterial);
        sphere.position.set(pos.x, pos.y, pos.z);
        
        const scale = 0.8 + Math.random() * 0.5; 
        sphere.scale.set(scale, scale * 0.7, scale);
        
        cloud.add(sphere);
    });

    return cloud;
}


function checkNPCInteraction() {
    if (!isGameStarted || isDialogueActive) return;
    if (!playerModel) return;
    const distance = playerModel.position.distanceTo(npc.position);
    const canInteract = distance < npc.userData.interactionRadius;

    if (canInteract) {
        if (missionCompleted && gatito && gatito.userData.found && gatito.visible) {
            showDialogue("Muito obrigado por trazer meu gatito! Aqui está seu fermento como prometido!");
            gatito.visible = false;
            gatito.userData.found = false;
            setTimeout(() => {
                showNotification("Item adquirido", "Fermento", "Imagens/fermento_fofo.png");
            }, 2500); 

            setTimeout(() => {
                showEndScreen();
            }, 3500);

        } else if (missionCompleted) {
            showDialogue("Muito obrigado novamente! Já estou com meu gatito e você já tem seu fermento!");
        } else {
            startDialogue();
        }
    }
}

function startDialogue() {
    isDialogueActive = true;

    if (missionAccepted) {
        currentDialogue = npc.userData.waitingDialogue;
    } else if (npc.userData.pendingResponse) {
        currentDialogue = npc.userData.pendingDialogue;
    } else {
        currentDialogue = npc.userData.dialogue;
    }

    if (missionCompleted) {
        showDialogue("Muito obrigado novamente! Já estou com meu gatito e você já tem seu fermento!");
        return;
    }
    
    currentDialogueIndex = 0;
    showDialogue(currentDialogue[currentDialogueIndex]);
}

function showDialogue(text) {
    const dialogueContainer = document.getElementById('dialogue-container');
    const dialogueText = document.getElementById('dialogue-text');
    
    dialogueContainer.style.display = 'flex';
    
    let i = 0;
    dialogueText.textContent = '';
    const typingEffect = setInterval(() => {
        if (i < text.length) {
            dialogueText.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typingEffect);
        }
    }, 20); 
    
}


function showOptions() {
    dialogueOptions.style.display = 'flex';
    dialogueText.innerHTML = "Acho uma troca justa, não acha? Você aceita?";
}

function selectOption(accepted) {
    missionAccepted = accepted;
    npc.userData.pendingResponse = !accepted;
    dialogueOptions.style.display = 'none';
    
    if (accepted) {
        showDialogue("Incrível! Vou ficar aqui esperando. Por favor, traga meu gatito de volta");
        const pos = gatitoPositions[Math.floor(Math.random() * gatitoPositions.length)];
        gatito.position.set(pos.x, pos.y, pos.z);
        gatito.visible = true;
        console.log("Missão aceita: Encontrar o gatito");
        console.log("Gatito posicionado em:", gatito.position);

    } else {
        showDialogue("Que pena... se mudar de ideia, estarei aqui.");
    }
    
    setTimeout(endDialogue, 3000);
}

function nextDialogue() {
    currentDialogueIndex++;
    
    if (currentDialogueIndex < currentDialogue.length) {
        showDialogue(currentDialogue[currentDialogueIndex]);
        
        if (!missionAccepted && !npc.userData.pendingResponse && 
            currentDialogueIndex === currentDialogue.length - 1) {
            showOptions();
        }
    } else {
        endDialogue();
    }
}

function endDialogue() {
    isDialogueActive = false;
    document.getElementById('dialogue-container').style.display = 'none';
}

function switchAnimation(toAction) {
    if (currentAction !== toAction) {
        currentAction.fadeOut(0.3);
        toAction.reset().fadeIn(0.3).play();
        currentAction = toAction;
    }
}

function showNotification(title, message, iconUrl) {
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notificationIcon.style.backgroundImage = `url(${iconUrl})`;
    notificationContainer.style.display = 'flex';
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    notificationContainer.style.display = 'none';
}


function animate() {
    if (playerMixer) playerMixer.update(1 / 60);
    world.step(1/60);  
    if (npcMixer) npcMixer.update(1 / 60);
    requestAnimationFrame(animate);

    updatePlayerMovement();
    updateCamera();

    if (portalLight) {
        const time = Date.now() * 0.001; 
        portalLight.intensity = 1.5 + Math.sin(time * 3) * 1; 
        portalLight.color.setHSL(0.6, 1, 0.5 + Math.sin(time) * 0.2); 
    }

    if (ballBody.position.y <= 0.51 && Math.abs(ballBody.velocity.y) < 0.1) {
        ballBody.velocity.y = 5; 
    }

    if (gatito && gatito.visible && playerModel && !gatito.userData.found && !missionCompleted) {
        const dist = playerModel.position.distanceTo(gatito.position);
        if (dist < 2) {
            gatito.position.set(-30.249433507251723, 0.01, -42.4096246259628);
            gatito.visible = true;
            showDialogue("Você encontrou o gatito!");

            gatito.userData.found = true;
            missionCompleted = true; 
            setTimeout(() => {
                endDialogue();
            }, 2500);
        }
    }
    renderer.render(scene, camera);
}

function showEndScreen() {
    document.querySelector('.game').style.display = 'none';
    endScreen.style.display = 'flex';
}

window.addEventListener('load', init);
