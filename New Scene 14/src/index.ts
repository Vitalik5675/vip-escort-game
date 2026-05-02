import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { Animator, AudioSource, AvatarBase, AvatarEquippedData, engine, GltfContainer, InputAction, PlayerIdentityData, pointerEventsSystem, timers, Transform, NetworkEntity, MeshRenderer, executeTask, AvatarAttach, AvatarAnchorPointType, MeshCollider, VisibilityComponent, Material, Entity, raycastSystem, RaycastQueryType, ColliderLayer } from '@dcl/sdk/ecs'
import { GameArea, GameSessions, SceneAdmins, SceneHost, ScenePlayers, getSyncEntity, getHost, setupUi, GameSettings, ModeAreaGeneration, SessionModeNPC, GameAreaGeneration, updateGameEntity, ButtonType, UpdateEntityState, UpdateEntityType, MeshColliderType, ShapeType, newGameSession, BarrierType, gameButtons } from './ui'
import { syncEntity, isStateSyncronized } from '@dcl/sdk/network'
import { getPlayer } from '@dcl/sdk/src/players'


export function main() {
  const entity = engine.addEntity()

  Transform.create(entity, {
    position: Vector3.create(0, 0, 0),
  })
  
  SceneAdmins.create(entity, {
    wallets: [
      '0x785aaba4a4efb0fa59b6e26c884c885ec7b2669a', //BITALIK
      '0x16f1d6d51c594b147ba40e3e113e9d24a24d193b', //Fabio
      '0x9b6994167b6de0de267f6450b4e6eecc2944dbc6', //Kara
    ]
  })

  SceneHost.create(entity, {
    host: { active: false, wallet: '', latestSync: 0 }
  })

  ScenePlayers.create(entity, {
    players: []
  })

  GameSettings.create(entity, {
    settings: {
      area: {
        position: Vector3.create(16, 8.5, 16),
        scale: Vector3.create(32, 5, 32),
        tilesNumberX: 8,
        tilesNumberZ: 8,
        tilesSize: 4
      },
      numberPlayersMin: 2,
      numberPlayersMax: 10,
      modeArea: ModeAreaGeneration.TEMPLATE,
      modeNPC: SessionModeNPC.VIP,
      waiting: 300,
      duration: 300,
      cooldown: 3,
      phaseInterval: 30
    }
  })

  GameSessions.create(entity, {
    gameSession: []
  })

  GameArea.create(entity, {
    area: { position: Vector3.create(16, 8.5, 16), scale: Vector3.create(32, 5, 32), tilesNumberX: 0, tilesNumberZ: 0, tilesSize: 0 },
    tiles: []
  })

  GameAreaGeneration.create(entity, {
    template: []
  })
  let syncNetworkEntities: Entity[] = []
  for (const [entityNetwork, networkData] of engine.getEntitiesWith(NetworkEntity)) {
    syncNetworkEntities.push(networkData.entityId)
  }
  if (syncNetworkEntities.some(network => network === 1)) {
    syncEntity(entity, [SceneAdmins.componentId, SceneHost.componentId, ScenePlayers.componentId, GameSettings.componentId, GameSessions.componentId, GameArea.componentId, GameAreaGeneration.componentId], 1)
  }
  console.log(JSON.stringify(syncNetworkEntities))

  if (isStateSyncronized()) {
    getSyncEntity()
  }

  updateGameEntity(
    UpdateEntityState.ADD,
    false,
    UpdateEntityType.BUTTON,
    ButtonType.JOIN,
    {
      transform: {
        position: Vector3.create(16, 1.8, 13.25),
        rotation: Quaternion.fromEulerDegrees(270, 0, 0),
        scale: Vector3.create(1, 1, 1)
      },
      gltfContainer: {
        src: 'assets/asset-packs/green_light_button/green_scifi_button.glb',
        invisibleCollision: [MeshColliderType.NONE],
        visibleCollision: [MeshColliderType.PHYSICS, MeshColliderType.POINTER]
      },
      visibility: { visible: true },
      animator: {
        states: [{
          clip: 'trigger',
          playing: false
        }]
      },
      audioSource: {
        audioClipUrl: 'assets/asset-packs/green_light_button/sound.mp3',
        playing: false
      },
      pointer: {
        opts: {
          button: InputAction.IA_PRIMARY,
          hoverText: 'Click',
          maxDistance: 10
        },
        pointerFunction: (event: any) => {
          updateGameEntity(
            UpdateEntityState.UPDATE,
            false,
            UpdateEntityType.BUTTON,
            ButtonType.JOIN,
            {
              entity: event.hit.entityId,
              gltfContainer: {
                src: 'assets/asset-packs/green_light_button/green_scifi_button.glb',
                invisibleCollision: [MeshColliderType.NONE],
                visibleCollision: [MeshColliderType.NONE]
              },
              visibility: { visible: false },
              animator: {
                states: [{
                  clip: 'trigger',
                  playing: true
                }]
              },
              audioSource: {
                audioClipUrl: 'assets/asset-packs/green_light_button/sound.mp3',
                playing: true
              }
            }
          )
          updateGameEntity(
            UpdateEntityState.UPDATE,
            false,
            UpdateEntityType.BUTTON,
            ButtonType.CANCEL,
            {
              entity: gameButtons.cancel,
              gltfContainer: {
                src: 'assets/asset-packs/red_light_button/red_scifi_button.glb',
                invisibleCollision: [MeshColliderType.NONE],
                visibleCollision: [MeshColliderType.PHYSICS, MeshColliderType.POINTER]
              },
              visibility: { visible: true },
              animator: {
                states: [{
                  clip: 'trigger',
                  playing: false
                }]
              },
              audioSource: {
                audioClipUrl: 'assets/asset-packs/red_light_button/sound.mp3',
                playing: false
              }
            }
          )
        }
      }
    }
  )

  updateGameEntity(
    UpdateEntityState.ADD,
    false,
    UpdateEntityType.BUTTON,
    ButtonType.CANCEL,
    {
      transform: {
        position: Vector3.create(16, 1.8, 13.25),
        rotation: Quaternion.fromEulerDegrees(270, 0, 0),
        scale: Vector3.create(1, 1, 1)
      },
      gltfContainer: {
        src: 'assets/asset-packs/red_light_button/red_scifi_button.glb',
        invisibleCollision: [MeshColliderType.NONE],
        visibleCollision: [MeshColliderType.PHYSICS, MeshColliderType.POINTER]
      },
      visibility: { visible: true },
      animator: {
        states: [{
          clip: 'trigger',
          playing: false
        }]
      },
      audioSource: {
        audioClipUrl: 'assets/asset-packs/red_light_button/sound.mp3',
        playing: false
      },
      pointer: {
        opts: {
          button: InputAction.IA_PRIMARY,
          hoverText: 'Click',
          maxDistance: 10
        },
        pointerFunction: (event: any) => {
          updateGameEntity(
            UpdateEntityState.UPDATE,
            false,
            UpdateEntityType.BUTTON,
            ButtonType.CANCEL,
            {
              entity: event.hit.entityId,
              gltfContainer: {
                src: 'assets/asset-packs/green_light_button/green_scifi_button.glb',
                invisibleCollision: [MeshColliderType.NONE],
                visibleCollision: [MeshColliderType.NONE]
              },
              visibility: { visible: false },
              animator: {
                states: [{
                  clip: 'trigger',
                  playing: true
                }]
              },
              audioSource: {
                audioClipUrl: 'assets/asset-packs/green_light_button/sound.mp3',
                playing: true
              }
            }
          )
          updateGameEntity(
            UpdateEntityState.UPDATE,
            false,
            UpdateEntityType.BUTTON,
            ButtonType.JOIN,
            {
              entity: gameButtons.join,
              gltfContainer: {
                src: 'assets/asset-packs/red_light_button/green_scifi_button.glb',
                invisibleCollision: [MeshColliderType.NONE],
                visibleCollision: [MeshColliderType.PHYSICS, MeshColliderType.POINTER]
              },
              visibility: { visible: true },
              animator: {
                states: [{
                  clip: 'trigger',
                  playing: false
                }]
              },
              audioSource: {
                audioClipUrl: 'assets/asset-packs/green_light_button/sound.mp3',
                playing: false
              }
            }
          )
        }
      }
    }
  )

  updateGameEntity(
    UpdateEntityState.ADD,
    false,
    UpdateEntityType.BARRIER,
    BarrierType.WALL,
    {
      transform: {
        position: Vector3.create(3, 1.5, 3),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(0.1, 3, 5)
      },
      material: {
        texture: {
          src: 'assets/asset-packs/concrete/FloorBaseConcrete_01/Floor_Concrete01.png.png'
        }
      },
      meshCollider: { shape: ShapeType.BOX },
      meshRenderer: { shape: ShapeType.BOX }
    }
  )

  updateGameEntity(
    UpdateEntityState.ADD,
    false,
    UpdateEntityType.BARRIER,
    BarrierType.WALL,
    {
      transform: {
        position: Vector3.create(5, 1.5, 3),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0),
        scale: Vector3.create(0.1, 3, 5)
      },
      material: {
        texture: {
          src: 'assets/asset-packs/concrete/FloorBaseConcrete_01/Floor_Concrete01.png.png'
        }
      },
      meshCollider: { shape: ShapeType.BOX },
      meshRenderer: { shape: ShapeType.BOX }
    }
  )

  setupUi()
}

const timeoutId = timers.setTimeout(() => {
  /*for (const [entity, data] of engine.getEntitiesWith(PlayerIdentityData)) {
    const myEntity = engine.addEntity()
    MeshRenderer.setBox(myEntity)
    AvatarAttach.create(myEntity, {
        anchorPointId: AvatarAnchorPointType.AAPT_LEFT_HAND,
        avatarId: data.address,
    })
}*/
getHost()
newGameSession()
}, 5000)



const intervalId = timers.setInterval(() => {
  if (isStateSyncronized()) {
    getHost()
  }
  /*for (const [entity, networkData] of engine.getEntitiesWith(NetworkEntity)) {
    if (networkData.entityId === 1) {
      console.log("ID сутності:", entity)
      console.log("Мережевий ID сутності:", networkData.entityId)
    }
  }*/
}, 100)

/*engine.addSystem(() => {
    for (const [entity, data, base, attach, transform] of engine.getEntitiesWith(
        PlayerIdentityData,
        AvatarBase,
        AvatarEquippedData,
        Transform
    )) {
        console.log('PLAYER DATA: ', JSON.stringify({ entity, data, transform, base, attach }))
    }
})*/
